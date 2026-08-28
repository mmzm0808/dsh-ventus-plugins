/**
 * team — 运行引擎（host 半身）。
 *
 * 一次 Run = 把链条展开成线性步骤，逐步执行并把快照写回 run.json：
 *   queued → running ─(全部步骤 done)→ done
 *                    ─(某步 error 且 stopOnError)→ error
 *                    ─(取消)→ cancelled（当前步 abort，后续 pending → skipped）
 *
 * 两条执行通道：
 *  - llm 直跑：ctx.llm.stream，可精确指定 provider/model；无工具。
 *  - subagent：ctx.subagents.start（需要 agent 上下文），有完整工具能力；支持角色/团队模型覆盖（agentOptions）。
 *
 * 流式增量：每 ~500ms 把当前步累积输出（截断）写进 run.json 的 steps[i].output，
 * 对话流 HUD 直接轮询快照即可看到实时进度，无需额外 SSE 通道。
 */
import { createUserMessage } from '@deepseek-ai/dsh-llm';
import { TeamError, effectiveGlobals, } from './types.js';
import { assertTeamRunnable, listProviders, planChain, planRoles, resolveModelChecked, } from './roster.js';
import { buildSystem, buildUserPrompt, renderFinalDocument, renderStepDocument } from './prompts.js';
import { capabilityCatalog, renderCapabilityNotice, renderInlineSkills, resolveCapabilities, } from './capabilities.js';
import { TEAM_SCHEMA_VERSION } from './types.js';
/** 默认单步输出上限。 */
const DEFAULT_MAX_TOKENS = 4096;
/** 流式快照写盘节流间隔。 */
const SNAPSHOT_INTERVAL_MS = 500;
/** 步骤输出写入快照的截断长度（完整内容在产物文件里）。 */
const SNAPSHOT_OUTPUT_MAX = 4000;
/** 输入快照截断长度。 */
const INPUT_SNAPSHOT_MAX = 2000;
/** 团队运行引擎。 */
export class TeamEngine {
    ctx;
    store;
    active = new Map();
    queue = [];
    runningCount = 0;
    /** 本次运行的能力目录快照（每个 Run 开始时取一次，避免每步重扫技能目录）。 */
    catalog = null;
    constructor(deps) {
        this.ctx = deps.ctx;
        this.store = deps.store;
    }
    /** 当前进行中的运行 id。 */
    activeRunIds() {
        return [...this.active.keys()];
    }
    /** 请求取消一次运行；返回是否命中。 */
    cancel(runId) {
        const handle = this.active.get(runId);
        if (handle === undefined)
            return false;
        handle.controller.abort();
        return true;
    }
    /**
     * 启动一次运行：同步创建 run.json（status=queued）并返回快照，
     * 执行在后台推进（调用方无需等待）。
     */
    start(input, context = {}) {
        const globals = this.store.readGlobals();
        const team = this.store.resolveTeam(input.teamId);
        const merged = effectiveGlobals(globals, team);
        const chain = input.chainId !== undefined && input.chainId !== ''
            ? team.chains.find(c => c.id === input.chainId) ?? null
            : null;
        if (input.chainId !== undefined && input.chainId !== '' && chain === null) {
            throw new TeamError(`链条不存在：${input.chainId}`, 'chain_not_found', 404);
        }
        assertTeamRunnable(team, chain);
        const planned = chain !== null
            ? planChain(team, chain)
            : planRoles(team, input.roles ?? [], input.synthesize !== false);
        if (planned.length === 0) {
            throw new TeamError('没有可执行的步骤（链条为空或角色 id 都不存在）', 'plan_empty', 409);
        }
        const task = input.task.trim();
        if (task === '')
            throw new TeamError('任务描述不能为空', 'task_required', 400);
        const runId = this.store.allocRunId();
        const now = new Date().toISOString();
        const run = {
            schemaVersion: TEAM_SCHEMA_VERSION,
            id: runId,
            teamId: team.id,
            teamName: team.name,
            chainId: chain?.id ?? null,
            chainName: chain?.name ?? (planned.map(p => p.role.name).join('→')),
            task,
            status: 'queued',
            origin: input.origin ?? 'panel',
            ...(input.sessionId !== undefined && input.sessionId !== '' ? { sessionId: input.sessionId } : {}),
            ...(input.modelOverrides !== undefined ? { modelOverrides: input.modelOverrides } : {}),
            startedAt: now,
            steps: planned.map(step => ({
                index: step.index,
                roleId: step.role.id,
                roleName: step.synthesize ? `${step.role.name}（整合）` : step.role.name,
                tagline: step.role.tagline,
                group: step.role.group,
                synthesize: step.synthesize,
                status: 'pending',
                inputSnapshot: '',
                output: '',
                modelUsed: { provider: '', model: '' },
                modelSource: 'team',
            })),
        };
        this.store.saveRun(run);
        this.store.trimRuns();
        // 后台推进（受 maxConcurrentRuns 限制）。
        void this.enqueue(merged.maxConcurrentRuns, async () => {
            await this.execute(runId, team, planned, merged, context);
        });
        return run;
    }
    /** 并发闸门：超出 maxConcurrentRuns 时排队。 */
    async enqueue(limit, job) {
        if (this.runningCount >= limit) {
            await new Promise((resolve) => { this.queue.push(resolve); });
        }
        this.runningCount += 1;
        try {
            await job();
        }
        finally {
            this.runningCount -= 1;
            const next = this.queue.shift();
            if (next !== undefined)
                next();
        }
    }
    /** 执行整个 Run（每步落盘快照）。
     *
     * 主循环为指针式 while：游标 cursor 指向当前要执行的 PlannedStep。
     *  - 普通 role/synthesize 步：照旧单步执行，cursor+1。
     *  - parallel 组：把同组（parallelGroup 相同且连续）的步骤一次性取出，Promise.all 并发
     *    执行；各成员 previous 截到 parallelBase 之前。整组完成后 cursor 跳到组尾。
     *  - loop 步：执行完读取其输出文本末尾的 {"verdict":"loop"|"done"} JSON；
     *    verdict=loop 且未达 maxLoopIterations 时，把 [backTo, cursor) 区间内步骤重置
     *    为 pending，cursor 拨回 backTo；否则继续 cursor+1（done 或到顶强制 done）。
     */
    async execute(runId, team, planned, globals, context) {
        let run = this.store.readRun(runId);
        if (run === null)
            return;
        const controller = new AbortController();
        this.active.set(runId, { runId, controller });
        const providers = listProviders(this.ctx);
        // 能力目录取一次快照供全部步骤复用（工具表 + 技能表 + 技能包账本）。
        try {
            this.catalog = await capabilityCatalog(this.ctx);
        }
        catch {
            this.catalog = null;
        }
        run = { ...run, status: 'running' };
        this.store.saveRun(run);
        let failed = false;
        /** run 级异常信息（不能只写进局部 run：后续会重读磁盘，会把它覆盖掉）。 */
        let runError = '';
        /** loop 回环计数：key = loop 步的 planned.index；每跳回一次 +1，到顶强制 done。 */
        const loopIterations = new Map();
        const maxLoopIterations = Math.max(1, globals.maxLoopIterations);
        try {
            let cursor = 0;
            while (cursor < planned.length) {
                if (controller.signal.aborted)
                    break;
                const step = planned[cursor];
                // ── parallel 组：收集同组连续步骤，Promise.all 并发执行 ──
                if (step.parallelGroup !== undefined) {
                    const group = [step];
                    let look = cursor + 1;
                    while (look < planned.length
                        && planned[look].parallelGroup === step.parallelGroup
                        && planned[look].parallelBase === step.parallelBase) {
                        group.push(planned[look]);
                        look += 1;
                    }
                    const base = step.parallelBase ?? step.index;
                    const outcomes = await Promise.all(group.map(member => this.runStep({
                        runId, team, planned: member, globals, providers, controller, context,
                        previousCutoff: base,
                    }).catch((error) => {
                        // runStep 内部已经兜底，本 catch 是双保险（如 patchStep 本身抛错）。
                        this.patchStep(runId, member.index, {
                            status: 'error',
                            finishedAt: new Date().toISOString(),
                            error: error instanceof Error ? error.message : String(error),
                        });
                        return 'error';
                    })));
                    run = this.store.readRun(runId) ?? run;
                    if (outcomes.some(o => o === 'error')) {
                        failed = true;
                        if (globals.stopOnError)
                            break;
                    }
                    cursor = look;
                    continue;
                }
                // ── 普通步 / loop 步 ──
                const outcome = await this.runStep({
                    runId, team, planned: step, globals, providers, controller, context,
                });
                run = this.store.readRun(runId) ?? run;
                if (outcome === 'error') {
                    failed = true;
                    if (globals.stopOnError)
                        break;
                    cursor += 1;
                    continue;
                }
                if (outcome !== 'done') {
                    cursor += 1;
                    continue;
                }
                // loop 步：解析 verdict，未达上限则回环到 backTo。
                if (step.loopBackTo !== undefined) {
                    const verdict = this.readLoopVerdict(runId, step.index);
                    const iterations = loopIterations.get(step.index) ?? 0;
                    if (verdict === 'loop' && iterations < maxLoopIterations) {
                        loopIterations.set(step.index, iterations + 1);
                        // 把 [backTo, cursor) 区间内所有步重置为 pending（loop 步自身保留 done，
                        // 待下一轮 cursor 走到这里时由 runStep 重新执行覆盖）。
                        this.resetRange(runId, step.loopBackTo, cursor);
                        cursor = step.loopBackTo;
                        continue;
                    }
                }
                cursor += 1;
            }
        }
        catch (error) {
            runError = error instanceof Error ? error.message : String(error);
            if (runError === '')
                runError = '运行失败（未提供错误信息）';
            failed = true;
        }
        finally {
            this.active.delete(runId);
        }
        run = this.store.readRun(runId) ?? run;
        const cancelled = controller.signal.aborted;
        const steps = run.steps.map(step => (step.status === 'pending' || step.status === 'running'
            ? { ...step, status: 'skipped' }
            : step));
        const status = cancelled ? 'cancelled' : failed ? 'error' : 'done';
        // 成功且有整合步时，把整合产出写为最终交付物。
        let finalFile = run.finalFile;
        if (!cancelled) {
            const synth = [...steps].reverse().find(step => step.synthesize && step.status === 'done');
            const source = synth ?? [...steps].reverse().find(step => step.status === 'done');
            if (source !== undefined) {
                try {
                    const full = source.outputFile !== undefined
                        ? this.store.readStepOutput(runId, source.outputFile)
                        : source.output;
                    finalFile = this.store.writeFinal(runId, renderFinalDocument(team, run.chainName, run.task, full));
                }
                catch { /* 交付物写入失败不影响运行结论 */ }
            }
        }
        // 失败原因：优先 run 级异常，否则汇总失败步骤的错误 —— 否则面板/HUD 只能看到
        // 一个没有任何线索的 error 状态（历史缺陷：catch 写进局部 run 后被磁盘重读覆盖）。
        let errorText = '';
        if (cancelled) {
            errorText = '运行已取消';
        }
        else if (failed) {
            if (runError !== '') {
                errorText = runError;
            }
            else {
                const reasons = steps
                    .filter(step => step.status === 'error')
                    .map(step => `${step.roleName}：${step.error !== undefined && step.error !== '' ? step.error : '未提供错误信息'}`);
                errorText = reasons.length > 0
                    ? reasons.join('；')
                    : '运行失败但未采集到具体原因（可能是所有步骤都未开始执行）';
            }
        }
        this.store.saveRun({
            ...run,
            steps,
            status,
            finishedAt: new Date().toISOString(),
            ...(finalFile !== undefined ? { finalFile } : {}),
            ...(errorText !== '' ? { error: errorText } : {}),
        });
    }
    /** 执行单步；返回 'done' | 'error' | 'skipped'。 */
    async runStep(args) {
        const { runId, team, planned, globals, providers, controller, context } = args;
        const startedAt = new Date().toISOString();
        let run = this.store.readRun(runId);
        if (run === null)
            return 'skipped';
        // 1) 解析模型（失败 → 本步 error，给可操作提示）。
        let binding;
        let source;
        try {
            const resolved = resolveModelChecked({
                ctx: this.ctx, team, role: planned.role, globals,
                ...(run.modelOverrides !== undefined ? { modelOverrides: run.modelOverrides } : {}),
            }, providers);
            binding = resolved.binding;
            source = resolved.source;
        }
        catch (error) {
            this.patchStep(runId, planned.index, {
                status: 'error',
                startedAt,
                finishedAt: new Date().toISOString(),
                error: error instanceof Error ? error.message : String(error),
            });
            return 'error';
        }
        // 2) 装配 prompt。
        const previous = run.steps.slice(0, args.previousCutoff ?? planned.index);
        let system = buildSystem(team, planned.role, planned.synthesize, {
            loop: planned.loopBackTo !== undefined,
        });
        const userPrompt = buildUserPrompt(team, planned, run.task, previous, globals, run.chainName);
        // 3) 选通道。
        const channel = this.pickChannel(planned.role.executor, context);
        const warnings = [];
        if (channel === 'subagent') {
            warnings.push('subagent 通道使用角色/团队模型设置（未解析出绑定模型时继承父会话）');
        }
        else if (planned.role.executor === 'subagent') {
            warnings.push('无 agent 上下文，已降级为 llm 直跑（本步无工具能力）');
        }
        // 3.5) 解析角色能力装配（工具 + 技能），拼进 system；subagent 通道另交 toolFilter。
        let toolFilter = null;
        let capabilityInfo;
        try {
            const resolvedCaps = await resolveCapabilities(this.ctx, planned.role, this.catalog ?? undefined);
            toolFilter = resolvedCaps.toolFilter;
            const notice = renderCapabilityNotice(resolvedCaps, channel);
            const inlineSkills = channel === 'llm' ? await renderInlineSkills(this.ctx, resolvedCaps) : '';
            const extra = [notice, inlineSkills].filter(part => part !== '').join('\n\n');
            if (extra !== '')
                system = `${system}\n\n${extra}`;
            if (resolvedCaps.toolMode !== 'inherit' || resolvedCaps.skillMode !== 'inherit') {
                capabilityInfo = {
                    toolMode: resolvedCaps.toolMode,
                    tools: resolvedCaps.toolNames,
                    skillMode: resolvedCaps.skillMode,
                    skills: resolvedCaps.skillNames,
                    ...(resolvedCaps.missingTools.length > 0 ? { missingTools: resolvedCaps.missingTools } : {}),
                    ...(resolvedCaps.missingSkills.length > 0 ? { missingSkills: resolvedCaps.missingSkills } : {}),
                    ...(channel === 'llm' && resolvedCaps.toolMode !== 'inherit'
                        ? { note: 'llm 直跑通道无工具执行能力，工具装配仅作提示声明' }
                        : {}),
                };
            }
            if (resolvedCaps.missingTools.length > 0 || resolvedCaps.missingSkills.length > 0) {
                warnings.push(`装配清单有当前环境缺失项：${[...resolvedCaps.missingTools, ...resolvedCaps.missingSkills].join('、')}`);
            }
            if (channel === 'llm' && resolvedCaps.skillMode === 'allow' && inlineSkills !== '') {
                warnings.push('技能正文已内联进提示词（llm 通道无 skill 工具）');
            }
        }
        catch {
            // 能力解析失败不阻断执行：按「完全继承」跑。
        }
        const warning = warnings.length > 0 ? warnings.join('；') : undefined;
        this.patchStep(runId, planned.index, {
            status: 'running',
            startedAt,
            inputSnapshot: userPrompt.slice(0, INPUT_SNAPSHOT_MAX),
            modelUsed: binding,
            modelSource: source,
            channel,
            ...(capabilityInfo !== undefined ? { capabilities: capabilityInfo } : {}),
            ...(warning !== undefined ? { warning } : {}),
        });
        // 4) 执行（带超时 + 重试）。
        const maxAttempts = Math.max(1, globals.maxRetries + 1);
        let lastError = '';
        for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
            if (controller.signal.aborted)
                return 'skipped';
            try {
                const text = await this.invoke({
                    channel, binding, system, userPrompt, globals, controller, context, toolFilter,
                    label: `${team.name} · ${planned.role.name}`,
                    runId,
                    stepIndex: planned.index,
                    onDelta: (accumulated) => {
                        this.patchStep(runId, planned.index, { output: tailSnapshot(accumulated) });
                    },
                });
                const outputFile = this.store.writeStepOutput(runId, planned.index, planned.role.id, renderStepDocument(team, planned, text, {
                    provider: binding.provider, model: binding.model, source, channel, startedAt,
                }));
                this.patchStep(runId, planned.index, {
                    status: 'done',
                    output: tailSnapshot(text),
                    outputFile,
                    finishedAt: new Date().toISOString(),
                    ...(attempt > 1 ? { retries: attempt - 1 } : {}),
                });
                return 'done';
            }
            catch (error) {
                if (controller.signal.aborted)
                    return 'skipped';
                lastError = error instanceof Error ? error.message : String(error);
                if (attempt < maxAttempts) {
                    this.patchStep(runId, planned.index, { retries: attempt, error: `第 ${attempt} 次失败：${lastError}，重试中` });
                }
            }
        }
        this.patchStep(runId, planned.index, {
            status: 'error',
            finishedAt: new Date().toISOString(),
            error: lastError,
            retries: maxAttempts - 1,
        });
        return 'error';
    }
    /** 通道选择（docs §4.3）。 */
    pickChannel(pref, context) {
        const hasAgent = context.exec?.agent !== undefined;
        const runtime = this.subagents();
        const canSubagent = hasAgent && runtime !== null && runtime.list().length > 0;
        if (pref === 'llm')
            return 'llm';
        if (pref === 'subagent')
            return canSubagent ? 'subagent' : 'llm';
        return canSubagent ? 'subagent' : 'llm';
    }
    /**
     * 取 subagents 运行时；不可用时返回 null（角色降级为 llm 直跑）。
     *
     * 必须走 `ctx.get('subagents')`：cordis 对**未在 inject 声明**的服务做裸属性访问
     * （`ctx.subagents`）会直接抛 `cannot get property "subagents" without inject`，
     * 而该异常发生在 pickChannel 里、runStep 的 try 之外 —— 整个运行会在第一步就崩，
     * 表现为「秒失败、所有步骤 skipped、连模型都没解析」。`ctx.get()` 对缺失服务返回
     * undefined，可安全降级。
     */
    subagents() {
        let runtime;
        try {
            runtime = this.ctx.get?.('subagents');
        }
        catch {
            return null;
        }
        return runtime !== undefined && runtime !== null && typeof runtime.list === 'function' ? runtime : null;
    }
    /** 调用一次通道（统一超时 + 取消语义）。 */
    async invoke(args) {
        const { channel, binding, system, userPrompt, globals, controller, context, toolFilter, label, runId, stepIndex, onDelta } = args;
        const stepController = new AbortController();
        const onAbort = () => stepController.abort();
        controller.signal.addEventListener('abort', onAbort, { once: true });
        const timer = setTimeout(() => stepController.abort(), globals.timeoutSec * 1000);
        try {
            if (channel === 'subagent') {
                const text = await this.invokeSubagent(`${system}\n\n---\n\n${userPrompt}`, label, context, stepController.signal, binding, toolFilter, { onDelta, onTodos: (todos) => { this.patchStep(runId, stepIndex, { todos }); } });
                onDelta(text);
                return text;
            }
            return await this.invokeLlm(binding, system, userPrompt, stepController.signal, onDelta);
        }
        catch (error) {
            if (controller.signal.aborted)
                throw new TeamError('运行已取消', 'cancelled', 409);
            if (stepController.signal.aborted) {
                // 透传底层真实原因：超时 abort 触发的原始异常（AbortError / provider 报错 /
                // 通道附带的进度提示）。否则用户只看到「超时」，无法区分 403 挂起、模型慢、子 agent 卡死。
                const detail = error instanceof Error ? error.message : String(error);
                const suffix = detail.trim() !== '' ? `；底层：${detail}` : '；底层未抛出任何异常信息';
                throw new TeamError(`本步超时（${globals.timeoutSec}s）${suffix}`, 'step_timeout', 504);
            }
            throw error;
        }
        finally {
            clearTimeout(timer);
            controller.signal.removeEventListener('abort', onAbort);
        }
    }
    /** llm 直跑：累积 text-delta，节流写快照。 */
    async invokeLlm(binding, system, userPrompt, signal, onDelta) {
        const llm = this.ctx.get?.('llm');
        if (llm === undefined)
            throw new TeamError('llm 服务不可用', 'llm_unavailable', 503);
        const messages = [createUserMessage({
                content: [{ type: 'text', text: userPrompt }],
                source: { kind: 'plugin', plugin: 'dsh-webui' },
            })];
        let out = '';
        let lastFlush = 0;
        try {
            for await (const chunk of llm.stream({
                provider: binding.provider,
                model: binding.model,
                messages,
                system,
                maxTokens: binding.maxTokens ?? DEFAULT_MAX_TOKENS,
                signal,
            })) {
                if (chunk.type === 'text-delta') {
                    out += chunk.text ?? '';
                    const now = Date.now();
                    if (now - lastFlush >= SNAPSHOT_INTERVAL_MS) {
                        lastFlush = now;
                        onDelta(out);
                    }
                    continue;
                }
                if (chunk.type !== 'finish')
                    continue;
                const reason = chunk.reason;
                if (reason === undefined)
                    continue;
                if (reason.kind === 'error')
                    throw new Error(reason.failure?.message ?? '模型调用失败');
                if (reason.kind === 'aborted')
                    throw new Error('模型调用被中止');
                if (reason.kind !== 'stop' && reason.kind !== 'max-tokens') {
                    throw new Error(`模型未正常结束：${reason.kind}`);
                }
            }
        }
        catch (error) {
            // 附进度信息：区分「provider 全程无输出（挂起/静默 403/网络中断）」与「流到一半被打断」。
            const base = error instanceof Error ? error.message : String(error);
            const progress = out === ''
                ? `未收到 ${binding.provider}/${binding.model} 的任何输出（疑似 provider 挂起、网络中断或静默报错）`
                : `已产出 ${out.length} 字符后中断`;
            throw new Error(`${base}（${progress}）`);
        }
        if (out.trim() === '') {
            throw new Error(`模型未返回内容（${binding.provider}/${binding.model}）`);
        }
        onDelta(out);
        return out;
    }
    /**
     * subagent 通道：完整 agent（有工具）。模型默认继承父会话；
     * binding 非空（provider/model 已解析）时经 `agentOptions` 覆盖为角色/团队绑定的
     * provider/model/maxTokens，空 binding 保持继承父会话（不传 agentOptions）。
     * `toolFilter` 非空时经 `subagents.start({ toolFilter })` 真实限制子 agent 的工具可见性
     * （被限制的工具从子 agent 提示词消失且拒绝执行）；provider 不支持该能力时降级为不限制。
     */
    async invokeSubagent(prompt, label, context, signal, binding, toolFilter, 
    /** 过程流出口：子会话的思考/正文增量实时转发（写步骤快照）。 */
    handlers) {
        const runtime = this.subagents();
        if (runtime === null)
            throw new TeamError('subagents 服务不可用', 'subagent_unavailable', 503);
        const names = runtime.list();
        if (names.length === 0)
            throw new TeamError('没有可用的 subagent provider', 'subagent_none', 503);
        const parent = context.exec?.agent;
        if (parent === undefined)
            throw new TeamError('当前无 agent 上下文，无法派发 subagent', 'no_agent', 409);
        // binding 空判断与 runStep 的解析口径一致：provider/model 皆空视为未绑定
        // （继承默认），不传 agentOptions；否则显式覆盖为角色/团队解析出的模型。
        const agentOptions = binding.provider !== '' && binding.model !== ''
            ? {
                provider: binding.provider,
                model: binding.model,
                ...(binding.maxTokens !== undefined ? { maxTokens: binding.maxTokens } : {}),
            }
            : null;
        const request = {
            parent,
            prompt: [{ type: 'text', text: prompt }],
            label,
            signal,
            ...(toolFilter !== null ? { toolFilter } : {}),
            ...(agentOptions !== null ? { agentOptions } : {}),
        };
        let run;
        try {
            run = await runtime.start(names[0], request);
        }
        catch (error) {
            // provider 不支持 toolFilter 能力时（capability 校验拒绝）降级重试一次，不限制工具。
            // agentOptions 仍需保留，否则降级路径会退回继承父会话模型。
            if (toolFilter !== null) {
                run = await runtime.start(names[0], {
                    parent, prompt: request.prompt, label, signal,
                    ...(agentOptions !== null ? { agentOptions } : {}),
                });
            }
            else {
                throw error;
            }
        }
        // 跟踪子会话日志：框架只回传最终文本，但本地子会话的事件流（思考/正文
        // 增量、todo_write 任务清单）持续落盘 —— 用水位线读原语把过程实时转发，
        // 用户不用干等，HUD/详情卡能看到子 agent 正在做什么、清单完成了什么。
        // 同时记录过程流水位：失败/超时时报告子 agent 是否在干活（区分挂起与慢）。
        let lastDeltaAt = 0;
        let lastDeltaTail = '';
        const stopTail = this.tailSubagentSession(run.id, {
            onDelta: (accumulated) => {
                lastDeltaAt = Date.now();
                lastDeltaTail = accumulated.slice(-200);
                handlers.onDelta(accumulated);
            },
            onTodos: handlers.onTodos,
        }, signal);
        try {
            const result = await run.result;
            if (result.stopReason !== 'completed' && result.stopReason !== 'max-tokens') {
                throw new Error(`subagent 未正常结束：${result.stopReason}${result.diagnostic !== undefined ? ` — ${result.diagnostic}` : ''}`);
            }
            const text = (Array.isArray(result.output) ? result.output : [])
                .filter(block => block.type === 'text')
                .map(block => block.text ?? '')
                .join('\n')
                .trim();
            if (text === '')
                throw new Error('subagent 未返回内容');
            return text;
        }
        catch (error) {
            // 附过程流摘要：全程无输出 ≈ 模型请求挂起 / provider 静默 403；有输出 ≈ 跑到一半被打断。
            const base = error instanceof Error ? error.message : String(error);
            const activity = lastDeltaAt === 0
                ? '子 agent 全程无任何输出（疑似模型请求挂起、provider 无响应或静默 403）'
                : `子 agent 最后输出距失败 ${Math.max(0, Math.round((Date.now() - lastDeltaAt) / 1000))}s${lastDeltaTail !== '' ? `，末尾片段：${JSON.stringify(lastDeltaTail.slice(-120))}` : ''}`;
            throw new Error(`${base}（${activity}）`);
        }
        finally {
            stopTail();
            await run.dispose();
        }
    }
    /**
     * 跟踪子 agent 会话日志，把思考/正文增量与任务清单转发给上层。
     *
     * 实现：sessionPersistence.readFrom(id, watermark) 是官方的「从水位线读后缀」
     * 原语（SQLite 后端只物理读后缀），每秒轮询一次：
     *  - assistant/chunk 的 reasoning-delta / text-delta → 拼成 Markdown 快照
     *    （思考为引用块、正文原样）经 handlers.onDelta 写进 run.json；
     *  - tool/call 的 todo_write → 解析其 todos 参数经 handlers.onTodos 写入步骤
     *    的结构化字段 —— HUD 卡与详情卡即可像对话流一样看到子 agent 的过程。
     * 子会话 id 拿不到 / 后端不支持 / 日志未就绪时静默降级零过程流。
     */
    tailSubagentSession(childId, handlers, signal) {
        if (childId === undefined || childId === '')
            return () => { };
        const persistence = this.ctx.get?.('sessionPersistence');
        if (persistence?.readFrom === undefined)
            return () => { };
        let stopped = false;
        let watermark = 0;
        let thinking = '';
        let answer = '';
        let todos = null;
        const renderSnapshot = () => {
            // 思考可能极长：快照只保留尾部（进行中看最新思路最有用）。
            const thinkTail = thinking.length > 2400 ? `…${thinking.slice(-2400)}` : thinking;
            const parts = [];
            if (thinkTail.trim() !== '') {
                parts.push(`> 🧠 **思考**\n>\n> ${thinkTail.trim().replace(/\n/g, '\n> ')}`);
            }
            if (answer.trim() !== '')
                parts.push(answer);
            return parts.join('\n\n');
        };
        void (async () => {
            while (!stopped && !signal.aborted) {
                try {
                    const inspection = await persistence.readFrom(childId, watermark, signal);
                    const events = Array.isArray(inspection?.events) ? inspection.events : [];
                    let grew = false;
                    for (const event of events) {
                        const e = event;
                        if (typeof e.seq === 'number' && e.seq > watermark)
                            watermark = e.seq;
                        // 任务清单：todo_write 工具调用（arguments 为 JSON 字符串）。
                        if (e.type === 'tool/call' && e.data?.name === 'todo_write' && typeof e.data.arguments === 'string') {
                            const parsedTodos = parseTodoWriteArgs(e.data.arguments);
                            if (parsedTodos !== null) {
                                todos = parsedTodos;
                                handlers.onTodos(todos);
                            }
                            continue;
                        }
                        // 思考/正文增量。
                        const chunk = e.data?.chunk;
                        if (e.type !== 'assistant/chunk' || chunk === null || typeof chunk !== 'object')
                            continue;
                        if (typeof chunk.text !== 'string' || chunk.text === '')
                            continue;
                        if (chunk.type === 'reasoning-delta') {
                            thinking += chunk.text;
                            grew = true;
                        }
                        else if (chunk.type === 'text-delta') {
                            answer += chunk.text;
                            grew = true;
                        }
                    }
                    if (grew)
                        handlers.onDelta(renderSnapshot());
                }
                catch {
                    // 会话日志尚未就绪 / 后端不支持 / 已取消：静默重试或退出。
                    if (signal.aborted)
                        break;
                }
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        })();
        return () => { stopped = true; };
    }
    /** 原子更新某步字段（读—改—写 run.json）。 */
    patchStep(runId, index, patch) {
        const run = this.store.readRun(runId);
        if (run === null)
            return;
        const steps = run.steps.map(step => (step.index === index ? { ...step, ...patch } : step));
        try {
            this.store.saveRun({ ...run, steps });
        }
        catch { /* 写盘失败不打断执行 */ }
    }
    /**
     * 把 [fromInclusive, toExclusive) 区间内所有步重置为 pending（loop 回环用）。
     * 清掉输出/时间戳/错误等运行态字段，保留 roleId/roleName 等编制字段。
     */
    resetRange(runId, fromInclusive, toExclusive) {
        const run = this.store.readRun(runId);
        if (run === null)
            return;
        const steps = run.steps.map((step) => {
            if (step.index < fromInclusive || step.index >= toExclusive)
                return step;
            const next = {
                ...step,
                status: 'pending',
                inputSnapshot: '',
                output: '',
                modelUsed: { provider: '', model: '' },
                modelSource: 'team',
            };
            delete next.outputFile;
            delete next.startedAt;
            delete next.finishedAt;
            delete next.error;
            delete next.retries;
            delete next.channel;
            delete next.warning;
            delete next.capabilities;
            delete next.todos;
            return next;
        });
        try {
            this.store.saveRun({ ...run, steps });
        }
        catch { /* 写盘失败不打断执行 */ }
    }
    /**
     * 读 loop 步的完整输出文本，解析末尾 verdict。
     * 优先读产物文件（outputFile）拿完整文本；读不到退化用快照 output（截断尾部，verdict
     * 通常在最末，快照截断策略保留尾部所以通常也能拿到）。
     */
    readLoopVerdict(runId, stepIndex) {
        const run = this.store.readRun(runId);
        const step = run?.steps.find(s => s.index === stepIndex);
        if (step === undefined)
            return 'done';
        let text = '';
        if (step.outputFile !== undefined) {
            try {
                text = this.store.readStepOutput(runId, step.outputFile);
            }
            catch {
                text = step.output;
            }
        }
        else {
            text = step.output;
        }
        return parseLoopVerdict(text);
    }
}
/** 快照输出：保留尾部（流式进行中看最新内容最有用）。 */
function tailSnapshot(text) {
    if (text.length <= SNAPSHOT_OUTPUT_MAX)
        return text;
    return `…（前文已截断）\n${text.slice(-SNAPSHOT_OUTPUT_MAX)}`;
}
/**
 * 解析 loop 步输出末尾的 verdict。
 *
 * 约定：loop 角色在正文末尾**单独一行**输出一个 JSON：
 *   {"verdict":"loop"}  或  {"verdict":"done"}  （可带 "reason" 等额外字段）
 *
 * 实现：从末行往前扫，找到**最后一个**可解析为 {"verdict":"loop"|"done"} 的 JSON 行；
 * 一行都匹配不到（角色没遵守约定）时按 'done' 处理（防死循环，由 maxLoopIterations 兜底）。
 */
function parseLoopVerdict(text) {
    if (text === '')
        return 'done';
    const lines = text.split('\n');
    for (let i = lines.length - 1; i >= 0; i -= 1) {
        const line = lines[i].trim();
        if (!line.startsWith('{') || !line.endsWith('}'))
            continue;
        try {
            const parsed = JSON.parse(line);
            if (parsed !== null && typeof parsed === 'object') {
                if (parsed.verdict === 'loop')
                    return 'loop';
                if (parsed.verdict === 'done')
                    return 'done';
            }
        }
        catch { /* 不是合法 JSON，继续往前找 */ }
    }
    return 'done';
}
/** todo_write 的 arguments（JSON 字符串）→ 任务清单投影；非法/空列表返回 null。 */
function parseTodoWriteArgs(raw) {
    try {
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed.todos))
            return null;
        const items = [];
        for (const item of parsed.todos) {
            const it = (item ?? {});
            const content = typeof it.content === 'string' ? it.content.trim() : '';
            if (content === '')
                continue;
            const status = it.status === 'in_progress' || it.status === 'completed' || it.status === 'pending'
                ? it.status
                : 'pending';
            items.push({ content, status });
        }
        return items.length > 0 ? items : null;
    }
    catch {
        return null;
    }
}
//# sourceMappingURL=engine.js.map