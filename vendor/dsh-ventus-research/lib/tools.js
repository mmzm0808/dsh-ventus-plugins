/**
 * dsh-ventus-research — 科研工作流 7 工具（rb_open / rb_derive / rb_verify /
 * rb_evidence / rb_adjudicate / rb_paper / rb_memory_sync）。
 *
 * 设计稿 4.2 契约 + 4.3 纯函数闸门 + 4.4 signature token。全部经
 * `ctx.tools.register(defineTool(...))` 注册；execute 返回符合 output.schema
 * 的结构化对象。工作区目录取自 `exec.agent.session.header.cwd`；「当前课题」
 * 由 rb_open 建立（内存态 currentRoot），其余工具基于它定位 .rb-state.json。
 *
 * 沙箱边界：rb_verify 不自行执行 verifier 脚本（不绕过 DSH 的 run_code 沙箱），
 * 而是要求模型先用 run_code 工具运行脚本生成 data/verify_<claim>.json，本工具
 * 只读该 JSON 并做纯函数判定。脚本内容登记为 verifier 资产（sim/ 下）。
 */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { defineTool } from '@deepseek-ai/dsh-tools';
import { gateNoVerify, transition, verdict } from './gates.js';
import { createEmptyState, ensureTopicDirs, findClaim, findConvention, localIso, nextAssetId, nextEvidenceId, pushOpLog, readState, scanAssets, sha256File, topicRoot, writeState, } from './state.js';
import { signatureTokens } from './token.js';
/** 当前课题根目录（rb_open 设置；DSH 重启后需重新 rb_open）。 */
let currentRoot = null;
/** 默认误差档位（设计稿 4.2 tol class）。 */
const DEFAULT_TOL = {
    A: { pass: 1e-3, warn: 1e-2 },
    B: { pass: 1e-2, warn: 5e-2 },
    C: { pass: 1e-1, warn: 5e-1 },
};
/** 从 exec 取会话工作区目录；拿不到返回 null。 */
function cwdOf(exec) {
    return exec.agent?.session?.header?.cwd ?? null;
}
/** 需要当前课题的工具的统一入口错误。 */
function needOpen() {
    return { ok: false, error: '尚未打开课题，请先调用 rb_open { topic }' };
}
/** 读当前课题 state；未打开或文件损坏返回 null。 */
function loadCurrentState() {
    if (currentRoot === null)
        return null;
    return readState(currentRoot);
}
/** 简易简报（设计稿：≤30 行三源重建 briefing）。 */
function buildBriefing(state, trust, pending) {
    const lines = [];
    lines.push(`课题 ${state.topic}  briefing（root: ${state.root}，trust: ${trust}）`);
    if (state.conventions.length === 0)
        lines.push('· 口径声明：无（跨口径比较会被拒绝）');
    else
        lines.push(`· 口径声明：${state.conventions.map(c => c.id).join(', ')}`);
    if (state.claims.length === 0)
        lines.push('· claims：无');
    else {
        lines.push(`· claims：${state.claims.length} 条`);
        for (const claim of state.claims) {
            const conv = claim.conventionId === undefined ? '' : ` [${claim.conventionId}]`;
            lines.push(`  - ${claim.id} v${claim.version} ${claim.status}${conv} ${claim.text}`);
        }
    }
    if (pending.length > 0) {
        lines.push(`· 未登记资产 ${pending.length} 个（可用 rb_verify/后续登记）：`);
        for (const asset of pending)
            lines.push(`  - ${asset.path} (${asset.kind})`);
    }
    if (state.evidence.length > 0)
        lines.push(`· 证据：${state.evidence.length} 条（stance 待人工确认 ${state.evidence.filter(e => e.stance === 'pending').length}）`);
    if (state.pendingMemory.length > 0)
        lines.push(`· 待写入记忆 ${state.pendingMemory.length} 条（待人工确认）`);
    return lines.slice(0, 30).join('\n');
}
/** 解析 verify JSON 里的相对误差；支持 err/relative_error/result+expected/results 数组。 */
function parseVerifyError(payload) {
    const num = (value) => typeof value === 'number' && Number.isFinite(value) ? value
        : typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Number(value)) ? Number(value)
            : null;
    const errDirect = num(payload.err ?? payload.relative_error);
    if (errDirect !== null)
        return { err: errDirect, detail: `直接误差 ${errDirect}` };
    const result = num(payload.result);
    const expected = num(payload.expected);
    if (result !== null && expected !== null) {
        if (expected === 0)
            return { err: Math.abs(result), detail: `|result|（expected=0）` };
        const err = Math.abs(result - expected) / Math.abs(expected);
        return { err, detail: `相对误差 |${result}-${expected}|/|${expected}| = ${err}` };
    }
    if (Array.isArray(payload.results) && Array.isArray(payload.expected) && payload.results.length === payload.expected.length) {
        let worst = 0;
        for (let i = 0; i < payload.results.length; i++) {
            const r = num(payload.results[i]);
            const e = num(payload.expected[i]);
            if (r === null || e === null)
                return { err: null, detail: `results/expected 第 ${i} 项非数值` };
            if (e === 0)
                worst = Math.max(worst, Math.abs(r));
            else
                worst = Math.max(worst, Math.abs(r - e) / Math.abs(e));
        }
        return { err: worst, detail: `数组逐项相对误差取最大 = ${worst}` };
    }
    return { err: null, detail: 'verify JSON 无法解析出误差：需包含 err / relative_error / (result+expected) / (results+expected) 之一' };
}
/** 注册全部 7 个工具；返回各注册的 disposer。 */
export function registerBenchTools(ctx, env) {
    const tolClasses = { ...DEFAULT_TOL, ...env.tolClasses };
    const disposers = [];
    disposers.push(ctx.tools.register(defineTool({
        name: 'rb_open',
        description: '科研工作流立项/上下文重建。给定课题名，从 .rb-state.json 三源重建 ≤30 行 briefing；state 缺失时建立目录契约并标 trust low。后续 rb_derive/verify/evidence/adjudicate/paper/memory_sync 都以本工具打开的课题为根。',
        parameters: {
            topic: { type: 'string', required: true, description: '课题名（如 EdgeDetail_260823；目录为 LaTeXDoc/<topic>）。' },
        },
        output: {
            schema: {
                type: 'object',
                additionalProperties: false,
                properties: {
                    ok: { type: 'boolean', required: true },
                    topic: { type: 'string' },
                    root: { type: 'string' },
                    trust: { type: 'string' },
                    briefing: { type: 'string' },
                    claimsCount: { type: 'integer' },
                    pendingAssets: { type: 'integer' },
                    error: { type: 'string' },
                },
            },
            render: (_args, value) => [{ type: 'text', text: value.briefing ?? value.error ?? String(value.ok) }],
        },
        async execute(args, exec) {
            const cwd = cwdOf(exec);
            if (cwd === null)
                return { ok: false, error: '无法确定会话工作区目录（exec.agent.session.header.cwd）' };
            const topic = args.topic.trim();
            if (topic === '')
                return { ok: false, error: 'topic 不能为空' };
            const root = topicRoot(cwd, topic);
            let state = readState(root);
            let trust;
            if (state === null) {
                ensureTopicDirs(root);
                state = createEmptyState(topic, root);
                writeState(root, state);
                trust = 'low';
            }
            else {
                trust = 'high';
            }
            currentRoot = root;
            state.lastOpened = localIso();
            const pending = scanAssets(root, state);
            const briefing = buildBriefing(state, trust, pending);
            state.briefingCache = briefing;
            pushOpLog(state, 'rb_open', 'ai', `root=${root} trust=${trust}`);
            writeState(root, state);
            return {
                ok: true,
                topic,
                root,
                trust,
                briefing,
                claimsCount: state.claims.length,
                pendingAssets: pending.length,
            };
        },
    })));
    disposers.push(ctx.tools.register(defineTool({
        name: 'rb_derive',
        description: '解析推导/版本。为 claim 写推导文件（notes/derivations/<claim>.md，含表达式与来源）并登记 derivation 资产。claim 不存在则创建；存在则 version+1 并重置为 derived（旧验证作废）。指定 convention_id 且未声明时返回 CONVENTION_UNKNOWN。frozen（已裁决/已发布）的 claim 拒绝修改。',
        parameters: {
            claim_id: { type: 'string', required: true, description: 'claim 编号（如 C-014）；不存在则新建。' },
            text: { type: 'string', description: 'claim 断言文本（新建时必填）。' },
            convention_id: { type: 'string', description: '口径声明 id；未声明过则报 CONVENTION_UNKNOWN。' },
            expression: { type: 'string', required: true, description: '推导表达式/内容（sympy 源或 LaTeX 闭式）。' },
        },
        output: {
            schema: {
                type: 'object',
                additionalProperties: false,
                properties: {
                    ok: { type: 'boolean', required: true },
                    claim_id: { type: 'string' },
                    version: { type: 'integer' },
                    status: { type: 'string' },
                    derive_ref: { type: 'string' },
                    error: { type: 'string' },
                },
            },
            render: (_args, value) => [{
                    type: 'text',
                    text: value.ok ? `rb_derive ${value.claim_id} v${value.version} → ${value.status}（${value.derive_ref}）` : `rb_derive 失败：${value.error}`,
                }],
        },
        async execute(args, exec) {
            const state = loadCurrentState();
            if (state === null)
                return needOpen();
            const claimId = args.claim_id.trim();
            if (claimId === '')
                return { ok: false, error: 'claim_id 不能为空' };
            if (args.convention_id !== undefined && findConvention(state, args.convention_id) === undefined) {
                return { ok: false, error: `CONVENTION_UNKNOWN: 未声明口径 ${args.convention_id}（先声明口径或改用已声明的 id）` };
            }
            let claim = findClaim(state, claimId);
            if (claim === undefined) {
                if (args.text === undefined || args.text.trim() === '')
                    return { ok: false, error: '新建 claim 必须提供 text' };
                claim = {
                    id: claimId,
                    version: 1,
                    status: 'draft',
                    text: args.text.trim(),
                    conventionId: args.convention_id,
                    tolClass: 'B',
                    evidenceRefs: [],
                    frozen: false,
                    supersededBy: null,
                };
                state.claims.push(claim);
            }
            else {
                if (claim.frozen)
                    return { ok: false, error: `claim ${claimId} 已冻结（${claim.status}），需先解除冻结或新建版本` };
                claim.version += 1;
                claim.text = args.text?.trim() ?? claim.text;
                if (args.convention_id !== undefined)
                    claim.conventionId = args.convention_id;
                if (claim.status !== 'draft' && claim.status !== 'derived')
                    claim.status = 'derived';
            }
            const next = transition(claim.status, 'derive');
            if (next !== null)
                claim.status = next;
            // 推导修改后旧验证作废。
            if (claim.status !== 'derived')
                claim.status = 'derived';
            const deriveRef = join('notes', 'derivations', `${claimId}.md`);
            const file = join(currentRoot, deriveRef);
            mkdirSync(join(currentRoot, 'notes', 'derivations'), { recursive: true });
            const stamp = `# ${claimId} 推导\n\n- 更新时间: ${localIso()}\n- version: ${claim.version}\n- 口径: ${claim.conventionId ?? '（未声明）'}\n\n## 表达式\n\n${args.expression}\n\n## 声明文本\n\n${claim.text}\n`;
            writeFileSync(file, stamp, 'utf8');
            claim.deriveRef = deriveRef;
            const assetPath = join(currentRoot, deriveRef);
            state.assets.push({
                id: nextAssetId(state, 'derivation'),
                kind: 'derivation',
                path: deriveRef,
                tags: [claimId],
                reusable: false,
                claimId,
                hash: sha256File(assetPath),
            });
            pushOpLog(state, 'rb_derive', 'ai', undefined, claimId);
            writeState(currentRoot, state);
            return { ok: true, claim_id: claimId, version: claim.version, status: claim.status, derive_ref: deriveRef };
        },
    })));
    disposers.push(ctx.tools.register(defineTool({
        name: 'rb_verify',
        description: '数值交叉验证（硬闸门）。前置：先用 run_code 工具执行 verifier 脚本，把结果写为 <root>/data/verify_<claim_id>.json，然后调用本工具读 JSON 做纯函数判定（PASS/WARN/FAIL）。JSON 可含 {err}、{relative_error}、{result,expected} 或 {results:[],expected:[]}。PASS→verified，WARN→needs-review，FAIL→mismatch。script 参数登记为 verifier 资产。',
        parameters: {
            claim_id: { type: 'string', required: true, description: 'claim 编号。' },
            script: { type: 'string', required: true, description: 'verifier 脚本内容或已有脚本路径；会被登记为 verifier 资产。' },
            tol_class: { type: 'string', description: '误差档位 A/B/C（或配置的自定义档位）。默认 B。' },
        },
        output: {
            schema: {
                type: 'object',
                additionalProperties: false,
                properties: {
                    ok: { type: 'boolean', required: true },
                    claim_id: { type: 'string' },
                    err: { type: 'number' },
                    tol_class: { type: 'string' },
                    verdict: { type: 'string' },
                    status: { type: 'string' },
                    verify_ref: { type: 'string' },
                    threshold: {
                        type: 'object',
                        additionalProperties: false,
                        properties: {
                            pass: { type: 'number', required: true },
                            warn: { type: 'number', required: true },
                        },
                    },
                    error: { type: 'string' },
                },
            },
            render: (_args, value) => [{
                    type: 'text',
                    text: value.ok
                        ? `rb_verify ${value.claim_id}：err=${value.err} → ${value.verdict}（状态 ${value.status}）`
                        : `rb_verify 失败：${value.error}`,
                }],
        },
        async execute(args, exec) {
            const state = loadCurrentState();
            if (state === null)
                return needOpen();
            const claimId = args.claim_id.trim();
            const claim = findClaim(state, claimId);
            if (claim === undefined)
                return { ok: false, error: `claim ${claimId} 不存在（先 rb_derive 创建）` };
            if (claim.frozen)
                return { ok: false, error: `claim ${claimId} 已冻结` };
            const tolClass = args.tol_class?.trim() ?? claim.tolClass ?? 'B';
            const band = tolClasses[tolClass];
            if (band === undefined)
                return { ok: false, error: `未知 tol_class ${tolClass}（可选 ${Object.keys(tolClasses).join('/')}）` };
            const root = currentRoot;
            const verifyFile = join(root, 'data', `verify_${claimId}.json`);
            if (!existsSync(verifyFile)) {
                return { ok: false, error: `未找到 ${verifyFile}——请先用 run_code 执行 verifier 脚本生成该 JSON，再调用 rb_verify` };
            }
            let payload;
            try {
                const parsed = JSON.parse(readFileSync(verifyFile, 'utf8'));
                if (typeof parsed !== 'object' || parsed === null)
                    throw new Error('not an object');
                payload = parsed;
            }
            catch (error) {
                return { ok: false, error: `verify JSON 解析失败：${error instanceof Error ? error.message : String(error)}` };
            }
            const parsed = parseVerifyError(payload);
            if (parsed.err === null)
                return { ok: false, error: parsed.detail };
            const result = verdict(parsed.err, band);
            let nextStatus;
            let action;
            if (result === 'PASS') {
                nextStatus = 'verified';
                action = 'verify-pass';
            }
            else if (result === 'WARN') {
                nextStatus = 'needs-review';
                action = 'verify-warn';
            }
            else {
                nextStatus = 'mismatch';
                action = 'verify-fail';
            }
            const target = transition(claim.status, action);
            if (target === null)
                return { ok: false, error: `claim ${claimId} 当前状态 ${claim.status} 不允许验证（需要 derived/needs-review/mismatch）` };
            claim.status = target;
            claim.tolClass = tolClass;
            claim.verifyRef = join('data', `verify_${claimId}.json`);
            // 登记 verifier 资产：script 是已有路径则登记之，否则写入 sim/py_<claim>.py。
            let verifierPath = args.script.trim();
            if (verifierPath.endsWith('.py') && existsSync(join(root, verifierPath))) {
                // 已存在脚本：直接登记相对路径
            }
            else {
                verifierPath = join('sim', `py_${claimId.toLowerCase().replaceAll('-', '_')}.py`);
                writeFileSync(join(root, verifierPath), `${args.script}\n`, 'utf8');
            }
            state.assets.push({
                id: nextAssetId(state, 'verifier'),
                kind: 'verifier',
                path: verifierPath.replaceAll('\\', '/'),
                tags: [claimId],
                reusable: true,
                claimId,
                hash: sha256File(join(root, verifierPath)),
            });
            pushOpLog(state, 'rb_verify', 'ai', `${result} err=${parsed.err}`, claimId);
            writeState(root, state);
            return {
                ok: true,
                claim_id: claimId,
                err: parsed.err,
                tol_class: tolClass,
                verdict: result,
                status: claim.status,
                verify_ref: claim.verifyRef,
                threshold: { pass: band.pass, warn: band.warn },
            };
        },
    })));
    disposers.push(ctx.tools.register(defineTool({
        name: 'rb_evidence',
        description: '文献/证据卡。为 verified 的 claim 建立证据条目并追加 notes/evidence_ledger.md 台账；claim 进入 evidenced。stance 默认 pending，需人工确认（confirmed）后才可进裁决。',
        parameters: {
            claim_id: { type: 'string', required: true, description: 'claim 编号（需为 verified）。' },
            source: { type: 'string', required: true, description: '文献来源（作者 + 标题/arXiv 号）。' },
            year: { type: 'integer', description: '发表年份。' },
            ref: { type: 'string', description: '内部位置引用（如 sec_flow.tex:39）。' },
            stance: { type: 'string', description: '证据立场 support/limit/counter；缺省 pending（待人工确认）。' },
            relation: { type: 'string', description: '与 claim 的关系说明。' },
            link: { type: 'string', description: '外部链接。' },
        },
        output: {
            schema: {
                type: 'object',
                additionalProperties: false,
                properties: {
                    ok: { type: 'boolean', required: true },
                    evidence_id: { type: 'string' },
                    claim_id: { type: 'string' },
                    stance: { type: 'string' },
                    status: { type: 'string' },
                    ledger: { type: 'string' },
                    error: { type: 'string' },
                },
            },
            render: (_args, value) => [{
                    type: 'text',
                    text: value.ok
                        ? `rb_evidence ${value.evidence_id}（${value.claim_id}）stance=${value.stance}，claim → ${value.status}。台账：${value.ledger}`
                        : `rb_evidence 失败：${value.error}`,
                }],
        },
        async execute(args, exec) {
            const state = loadCurrentState();
            if (state === null)
                return needOpen();
            const claimId = args.claim_id.trim();
            const claim = findClaim(state, claimId);
            if (claim === undefined)
                return { ok: false, error: `claim ${claimId} 不存在` };
            if (claim.status !== 'verified')
                return { ok: false, error: `claim ${claimId} 状态为 ${claim.status}，需 verified 才能收集证据` };
            const stanceRaw = args.stance?.trim();
            const stance = stanceRaw === 'support' || stanceRaw === 'limit' || stanceRaw === 'counter' ? stanceRaw : 'pending';
            const evidenceId = nextEvidenceId(state);
            state.evidence.push({
                id: evidenceId,
                claimId,
                source: args.source.trim(),
                ...(args.year === undefined ? {} : { year: args.year }),
                ...(args.ref === undefined ? {} : { ref: args.ref }),
                ...(args.link === undefined ? {} : { link: args.link }),
                ...(args.relation === undefined ? {} : { relation: args.relation }),
                stance,
                verifiedBy: stance === 'pending' ? undefined : 'pending-confirm',
            });
            claim.evidenceRefs.push(evidenceId);
            const target = transition(claim.status, 'evidence');
            if (target === null)
                return { ok: false, error: `claim ${claimId} 状态 ${claim.status} 不允许收集证据` };
            claim.status = target;
            // 追加证据台账（不存在则建）。
            const root = currentRoot;
            const ledgerRel = join('notes', 'evidence_ledger.md');
            const ledgerFile = join(root, ledgerRel);
            const rows = [`| ${claimId} | ${evidenceId} | ${args.source.trim()} | ${args.year ?? '—'} | ${stance} | ${stance === 'pending' ? '待确认' : 'pending-confirm'} | ${args.relation ?? '—'} | ${args.ref ?? '—'} |`];
            const header = `# 证据台账 — ${state.topic}\n\n更新: ${localIso()}\n\n## 证据卡\n\n| claim_id | evidence_id | source | year | stance | verified_by | 关联结论 | 冲突判定 |\n|---|---|---|---|---|---|---|---|\n`;
            let content;
            if (existsSync(ledgerFile)) {
                const existing = readFileSync(ledgerFile, 'utf8');
                content = existing.trimEnd() + '\n' + rows.join('\n') + '\n';
            }
            else {
                content = header + rows.join('\n') + '\n';
            }
            writeFileSync(ledgerFile, content, 'utf8');
            // 登记 evidence-card 资产（台账本身）。
            state.assets.push({
                id: nextAssetId(state, 'evidence-card'),
                kind: 'evidence-card',
                path: ledgerRel,
                tags: [claimId],
                reusable: false,
                claimId,
                hash: sha256File(ledgerFile),
            });
            pushOpLog(state, 'rb_evidence', 'ai', undefined, claimId);
            writeState(root, state);
            const pendingHint = stance === 'pending' ? '（stance 待人工确认后才可裁决）' : '';
            return { ok: true, evidence_id: evidenceId, claim_id: claimId, stance, status: claim.status, ledger: ledgerRel + pendingHint };
        },
    })));
    disposers.push(ctx.tools.register(defineTool({
        name: 'rb_adjudicate',
        description: '观点—证据—裁决（人工裁决点）。校验一次性 signature token（POST /research-bench/sign 获取，5 分钟有效、单次使用）。无 token 返回 NEEDS_HUMAN_SIGNATURE。成功则 claim 进入 adjudicated 并冻结。前置：claim 需为 evidenced 且其全部证据 stance 已人工确认。',
        parameters: {
            claim_id: { type: 'string', required: true, description: 'claim 编号（需为 evidenced）。' },
            verdict: { type: 'string', required: true, description: 'accepted / limited / rejected。' },
            note: { type: 'string', description: '裁决理由。' },
            signature_token: { type: 'string', required: true, description: '人工签字令牌（POST /research-bench/sign 获取）。' },
        },
        output: {
            schema: {
                type: 'object',
                additionalProperties: false,
                properties: {
                    ok: { type: 'boolean', required: true },
                    claim_id: { type: 'string' },
                    verdict: { type: 'string' },
                    status: { type: 'string' },
                    error: { type: 'string' },
                },
            },
            render: (_args, value) => [{
                    type: 'text',
                    text: value.ok
                        ? `rb_adjudicate ${value.claim_id} → ${value.verdict}（${value.status}）`
                        : `rb_adjudicate 失败：${value.error}`,
                }],
        },
        async execute(args, exec) {
            const state = loadCurrentState();
            if (state === null)
                return needOpen();
            const claimId = args.claim_id.trim();
            const claim = findClaim(state, claimId);
            if (claim === undefined)
                return { ok: false, error: `claim ${claimId} 不存在` };
            if (claim.status !== 'evidenced')
                return { ok: false, error: `claim ${claimId} 状态为 ${claim.status}，需 evidenced 才能裁决` };
            const verdictValue = args.verdict.trim();
            if (verdictValue !== 'accepted' && verdictValue !== 'limited' && verdictValue !== 'rejected') {
                return { ok: false, error: `verdict 必须是 accepted/limited/rejected，得到 ${verdictValue}` };
            }
            if (!signatureTokens.consume(args.signature_token.trim(), claimId, claim.version)) {
                return { ok: false, error: 'NEEDS_HUMAN_SIGNATURE: 签名令牌缺失/过期/不匹配。请人类用户在浏览器访问 POST /research-bench/sign {claim_id, revision} 获取一次性令牌后再试。' };
            }
            state.adjudications.push({
                claim: claimId,
                verdict: verdictValue,
                by: 'human',
                at: localIso(),
                ...(args.note === undefined ? {} : { note: args.note }),
            });
            const target = transition(claim.status, 'adjudicate');
            if (target === null)
                return { ok: false, error: `claim ${claimId} 状态 ${claim.status} 不允许裁决` };
            claim.status = target;
            claim.frozen = true;
            pushOpLog(state, 'rb_adjudicate', 'ai', `verdict=${verdictValue}`, claimId);
            writeState(currentRoot, state);
            return { ok: true, claim_id: claimId, verdict: verdictValue, status: claim.status };
        },
    })));
    disposers.push(ctx.tools.register(defineTool({
        name: 'rb_paper',
        description: 'LaTeX 成稿。逐 claim 检查硬闸门 gateNoVerify（无 verify_ref 或未裁决 → GATE_NO_VERIFY 拒绝），全部通过后生成 notes/sec_<name>.tex 骨架与主 tex（main.tex \input），并尝试 xelatex 两遍编译写入 build_log。已裁决 claim 的 texRef 会更新；published 需要人工定稿签字（后续 finalize 流程）。',
        parameters: {
            claim_ids: { type: 'array', required: true, items: { type: 'string' }, description: '要写入论文的 claim 编号列表。' },
            page_budget: { type: 'integer', description: '目标页数预算（build_log 记录，缺省 8）。' },
            title: { type: 'string', description: '论文标题（缺省用课题名）。' },
        },
        output: {
            schema: {
                type: 'object',
                additionalProperties: false,
                properties: {
                    ok: { type: 'boolean', required: true },
                    claims: { type: 'array' },
                    main_tex: { type: 'string' },
                    build_status: { type: 'string' },
                    error: { type: 'string' },
                },
            },
            render: (_args, value) => [{
                    type: 'text',
                    text: value.ok
                        ? `rb_paper：${value.claims?.length ?? 0} 个 claim 通过闸门，主 tex=${value.main_tex}，build=${value.build_status}`
                        : `rb_paper 失败：${value.error}`,
                }],
        },
        async execute(args, exec) {
            const state = loadCurrentState();
            if (state === null)
                return needOpen();
            const root = currentRoot;
            const targetBudget = args.page_budget ?? 8;
            const blocked = [];
            const usable = [];
            for (const rawId of args.claim_ids) {
                const claimId = rawId.trim();
                const claim = findClaim(state, claimId);
                if (claim === undefined) {
                    blocked.push(`${claimId}（不存在）`);
                    continue;
                }
                const gate = gateNoVerify(claim);
                if (gate !== 'PASS') {
                    blocked.push(`${claimId}（${gate}：${claim.status}）`);
                    continue;
                }
                usable.push(claim);
            }
            if (blocked.length > 0) {
                return { ok: false, error: `以下 claim 未通过硬闸门，拒绝写 tex：${blocked.join('、')}（先 rb_verify 且 rb_adjudicate）` };
            }
            if (usable.length === 0)
                return { ok: false, error: '没有可写入的 claim' };
            const secName = state.topic.replace(/[^A-Za-z0-9_]/gu, '_');
            const secRel = join('notes', `sec_${secName}.tex`);
            const secFile = join(root, secRel);
            const lines = [
                `% ${state.topic} — 由 rb_paper 生成，勿手改`,
                `% 生成: ${localIso()}`,
                `\\section{Results}`,
            ];
            for (const claim of usable) {
                const conv = claim.conventionId === undefined ? '' : ` (口径 ${claim.conventionId})`;
                lines.push('');
                lines.push(`\\paragraph{${claim.id}} ${claim.text.replaceAll('&', '\\&').replaceAll('%', '\\%')}${conv}`);
                if (claim.verifyRef !== undefined)
                    lines.push(`\\emph{已验证，误差档 ${claim.tolClass}（${claim.verifyRef}）。}`);
                claim.texRef = `${secRel}#${claim.id}`;
            }
            writeFileSync(secFile, lines.join('\n') + '\n', 'utf8');
            const mainRel = join('main.tex');
            const mainFile = join(root, mainRel);
            writeFileSync(mainFile, `\\documentclass{article}\n\\begin{document}\n\\title{${args.title ?? state.topic}}\n\\maketitle\n\\input{${secRel.replaceAll('\\', '/')}}\n\\end{document}\n`, 'utf8');
            // 尝试 xelatex 两遍编译（探测式弱依赖）。
            let buildStatus = 'no_latex';
            let exit = -1;
            try {
                const probe = spawnSync('xelatex', ['-version'], { stdio: 'pipe', encoding: 'utf8' });
                if (probe.status === 0) {
                    spawnSync('xelatex', ['-interaction=nonstopmode', mainRel], { cwd: root, stdio: 'pipe', encoding: 'utf8' });
                    const second = spawnSync('xelatex', ['-interaction=nonstopmode', mainRel], { cwd: root, stdio: 'pipe', encoding: 'utf8' });
                    exit = second.status ?? -1;
                    buildStatus = exit === 0 ? 'compiled' : 'compile_failed';
                }
            }
            catch {
                buildStatus = 'no_latex';
            }
            state.buildLog.push({
                at: localIso(),
                ...(exit === 0 ? { pdf: `${state.topic}.pdf` } : {}),
                targetPages: targetBudget,
                exit,
                status: buildStatus,
            });
            // MVP：写 tex 后不自动转 published（published 需人工定稿签字，见状态机）。
            // claim.texRef 已更新，状态保持 adjudicated。
            pushOpLog(state, 'rb_paper', 'ai', `claims=${usable.length} build=${buildStatus}`);
            writeState(root, state);
            const nextHint = exit === 0 ? '' : '（本机未装 xelatex 或编译失败，tex 骨架仍已生成）';
            return { ok: true, claims: usable.map(c => c.id), main_tex: mainRel, build_status: buildStatus + nextHint };
        },
    })));
    disposers.push(ctx.tools.register(defineTool({
        name: 'rb_memory_sync',
        description: '长期记忆暂存（人工确认后写入）。把待写事实暂存到 .rb-state.json 的 pendingMemory[]，由人类在记忆面板确认后再写入 dsh-memory。MVP 不直接写 dsh-memory（避免依赖未定契约），只登记待确认项。',
        parameters: {
            facts: { type: 'array', required: true, items: { type: 'string' }, description: '待写入的事实/偏好列表。' },
            project_scope: { type: 'boolean', description: 'true=项目级记忆，false=全局；缺省 true。' },
        },
        output: {
            schema: {
                type: 'object',
                additionalProperties: false,
                properties: {
                    ok: { type: 'boolean', required: true },
                    pending: { type: 'integer' },
                    hint: { type: 'string' },
                    error: { type: 'string' },
                },
            },
            render: (_args, value) => [{
                    type: 'text',
                    text: value.ok ? `rb_memory_sync：已暂存 ${value.pending} 条待人工确认${value.hint}` : `rb_memory_sync 失败：${value.error}`,
                }],
        },
        async execute(args, exec) {
            const state = loadCurrentState();
            if (state === null)
                return needOpen();
            const facts = args.facts
                .map(f => (typeof f === 'string' ? f : String(f)).trim())
                .filter(f => f !== '');
            if (facts.length === 0)
                return { ok: false, error: 'facts 为空' };
            const at = localIso();
            for (const text of facts)
                state.pendingMemory.push({ text, projectScope: args.project_scope !== false, at });
            pushOpLog(state, 'rb_memory_sync', 'ai', `facts=${facts.length}`);
            writeState(currentRoot, state);
            return { ok: true, pending: state.pendingMemory.length, hint: '（请在记忆面板人工确认后写入 dsh-memory）' };
        },
    })));
    return disposers;
}
/** 设置当前课题根（index.ts 用 /research-bench/sign 也可用）。 */
export function setCurrentBenchRoot(root) {
    currentRoot = root;
}
/** 取当前课题根。 */
export function getCurrentBenchRoot() {
    return currentRoot;
}
//# sourceMappingURL=tools.js.map