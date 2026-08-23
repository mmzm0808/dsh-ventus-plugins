/**
 * dsh-memory HTTP API（loopback-only）：/api/dsh-memory/*。
 * 面板数据 + 裁决操作（保留/删除/改标签/移项目/置顶/手动归属）。
 * 与 skill-manager 同款 webServer 路由模式；前缀 /api/dsh-memory 不与其它插件冲突。
 */
import { URL } from 'node:url';
import { createUserMessage, ReasoningEffortId } from '@deepseek-ai/dsh-llm';
import { compileAll } from './engine/compile.js';
import { localDate, mergeTags, nowIso, projectHashOf, entryIdOf, summarize } from './engine/store.js';
const ROUTE_PREFIX = '/api/dsh-memory';
let consolidateUndo = null;
function toView(entry) {
    return {
        id: entry.id,
        content: entry.content,
        scope: entry.scope,
        projectHash: entry.projectHash,
        tags: entry.tags,
        pinned: entry.pinned,
        importance: entry.importance,
        layer: entry.layer,
        source: entry.source,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
    };
}
/** 挂载全部路由。 */
export function mountMemoryRoutes(ctx, store, config) {
    return ctx.webServer.register({
        kind: 'prefix',
        path: ROUTE_PREFIX,
        handler: (req, res) => {
            void handle(ctx, store, config, req, res);
        },
    });
}
async function handle(ctx, store, config, req, res) {
    if (!loopbackAllowed(req)) {
        json(res, 403, { error: 'loopback-only' });
        return;
    }
    let url;
    let rest;
    let method;
    try {
        url = new URL(req.url ?? '/', 'http://localhost');
        rest = url.pathname.slice(ROUTE_PREFIX.length);
        method = req.method ?? 'GET';
    }
    catch {
        json(res, 400, { error: 'invalid request url' });
        return;
    }
    // API 诊断日志：请求到达与完成时间（排查面板「读取中」= 请求未达 vs host 未响应）。
    const apiStarted = Date.now();
    void store.appendExtractLog(`api ${method} ${rest} start`).catch(() => undefined);
    try {
        // ── 查询 ──────────────────────────────────────────────────────────
        if (method === 'GET' && rest === '/list') {
            json(res, 200, await listView(store, url.searchParams));
            return;
        }
        if (method === 'GET' && rest === '/projects') {
            const entries = await store.readEntries();
            json(res, 200, { projects: await mergeWorkspaces(store, await store.listProjects(entries)) });
            return;
        }
        if (method === 'GET' && rest === '/tags') {
            const entries = await store.readEntries();
            const counts = new Map();
            for (const entry of entries) {
                for (const tag of entry.tags)
                    counts.set(tag, (counts.get(tag) ?? 0) + 1);
            }
            json(res, 200, { tags: [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([tag, count]) => ({ tag, count })) });
            return;
        }
        if (method === 'GET' && rest === '/changes') {
            const date = url.searchParams.get('date') ?? localDate();
            json(res, 200, { date, changes: await store.readChanges(date) });
            return;
        }
        if (method === 'GET' && rest === '/summary') {
            const entries = await store.readEntries();
            const today = localDate();
            json(res, 200, {
                today,
                entryCount: entries.length,
                projectCount: (await store.listProjects(entries)).length,
                todayChanges: (await store.readChanges(today)).length,
            });
            return;
        }
        // ── 记忆注入开关（按会话） ────────────────────────────────────────
        if (method === 'GET' && rest === '/inject-state') {
            const sessionId = url.searchParams.get('sessionId') ?? '';
            json(res, 200, { enabled: await store.isInjectEnabled(sessionId) });
            return;
        }
        if (method === 'POST' && rest === '/inject-state') {
            const body = await readBody(req);
            const sessionId = requireString(body.sessionId, 'sessionId');
            const enabled = body.enabled !== false;
            await store.setInjectEnabled(sessionId, enabled);
            json(res, 200, { ok: true, enabled });
            return;
        }
        // ── 裁决操作 ──────────────────────────────────────────────────────
        if (method === 'POST' && rest === '/pin') {
            const body = await readBody(req);
            const entryId = requireString(body.entryId, 'entryId');
            const pinned = body.pinned !== false;
            const entry = await store.patchEntry(entryId, { pinned });
            if (entry === undefined)
                throw new Error(`记忆不存在：${entryId}`);
            json(res, 200, { ok: true, entry: toView(entry) });
            return;
        }
        if (method === 'POST' && rest === '/update') {
            const body = await readBody(req);
            const entryId = requireString(body.entryId, 'entryId');
            const patch = {};
            if (typeof body.content === 'string' && body.content.trim() !== '') {
                patch.content = body.content.trim();
            }
            if (Array.isArray(body.tags)) {
                patch.tags = body.tags.filter((tag) => typeof tag === 'string' && tag.trim() !== '').map(tag => tag.trim()).slice(0, 8);
            }
            const before = await store.getEntry(entryId);
            const entry = await store.patchEntry(entryId, patch);
            if (entry === undefined)
                throw new Error(`记忆不存在：${entryId}`);
            await store.appendChange({
                action: 'update',
                entryId: entry.id,
                scope: entry.scope,
                projectHash: entry.projectHash,
                summary: summarize(entry.content),
                before: before?.content,
                after: entry.content,
            });
            json(res, 200, { ok: true, entry: toView(entry) });
            return;
        }
        // ── 整合记忆：调模型去重/精简/合并相似条目 ───────────────────────
        if (method === 'POST' && rest === '/consolidate') {
            const body = await readBody(req);
            const summary = await consolidateMemory(ctx, store, body);
            json(res, 200, { ok: true, ...summary, undoable: true, at: consolidateUndo?.at ?? null });
            return;
        }
        // ── 整合撤回：状态查询 / 执行恢复 ────────────────────────────────
        if (method === 'GET' && rest === '/consolidate-undo') {
            json(res, 200, { ok: true, undoable: consolidateUndo !== null, at: consolidateUndo?.at ?? null });
            return;
        }
        if (method === 'POST' && rest === '/consolidate-undo') {
            if (consolidateUndo === null) {
                json(res, 400, { error: '没有可撤回的整合' });
                return;
            }
            const snapshot = consolidateUndo;
            const current = await store.readEntries();
            const snapIds = new Set(snapshot.entries.map(entry => entry.id));
            let restored = 0;
            // 删除整合期间新增的条目。
            for (const entry of current) {
                if (!snapIds.has(entry.id)) {
                    if (await store.removeEntry(entry.id))
                        restored++;
                }
            }
            // 恢复被修改/删除的条目（内容/归属/标签/置顶全量还原）。
            for (const snap of snapshot.entries) {
                const existing = current.find(entry => entry.id === snap.id);
                if (existing === undefined) {
                    await store.upsertEntry({
                        content: snap.content,
                        scope: snap.scope,
                        projectHash: snap.projectHash,
                        tags: snap.tags,
                        pinned: snap.pinned,
                        importance: snap.importance,
                        layer: snap.layer,
                    });
                    restored++;
                }
                else if (existing.content !== snap.content || existing.scope !== snap.scope
                    || existing.projectHash !== snap.projectHash || existing.pinned !== snap.pinned
                    || existing.tags.join(' ') !== snap.tags.join(' ')) {
                    await store.patchEntry(snap.id, {
                        content: snap.content,
                        scope: snap.scope,
                        projectHash: snap.projectHash,
                        tags: snap.tags,
                        pinned: snap.pinned,
                        importance: snap.importance,
                        layer: snap.layer,
                        source: snap.source,
                    });
                    restored++;
                }
            }
            consolidateUndo = null;
            await compileAll(store, { compileThreshold: 30, injectTokenBudget: 2000 })
                .catch(() => undefined);
            json(res, 200, { ok: true, restored });
            return;
        }
        if (method === 'POST' && rest === '/move') {
            const body = await readBody(req);
            const entryId = requireString(body.entryId, 'entryId');
            const existing = await store.getEntry(entryId);
            if (existing === undefined)
                throw new Error(`记忆不存在：${entryId}`);
            let scope = existing.scope;
            let projectHash = existing.projectHash;
            if (body.scope === 'global') {
                scope = 'global';
                projectHash = null;
            }
            else if (body.scope === 'project') {
                scope = 'project';
                projectHash = typeof body.projectHash === 'string' && body.projectHash !== ''
                    ? body.projectHash
                    : existing.projectHash;
                if (projectHash === null)
                    throw new Error('移入项目需要 projectHash');
                // 目标项目无 meta 时自动创建占位（手动归属）。
                const meta = await store.readProjectMeta(projectHash);
                if (meta === undefined) {
                    await store.writeProjectMeta(projectHash, {
                        path: typeof body.path === 'string' && body.path !== '' ? body.path : '手动归属',
                        alias: null,
                        locked: true,
                    });
                }
            }
            const entry = await store.patchEntry(entryId, { scope, projectHash });
            if (entry === undefined)
                throw new Error(`记忆不存在：${entryId}`);
            await store.appendChange({
                action: 'update',
                entryId: entry.id,
                scope: entry.scope,
                projectHash: entry.projectHash,
                summary: `移项目：${summarize(entry.content)}`,
                before: existing.content,
                after: entry.content,
            });
            await compileAll(store, config);
            json(res, 200, { ok: true, entry: toView(entry) });
            return;
        }
        if (method === 'POST' && rest === '/delete') {
            const body = await readBody(req);
            const entryId = requireString(body.entryId, 'entryId');
            const existing = await store.getEntry(entryId);
            // 幂等删除：条目已不存在时也返回 ok（面板旧数据/幽灵条目删除不再报错）。
            if (existing === undefined) {
                json(res, 200, { ok: true, alreadyGone: true });
                return;
            }
            const ok = await store.removeEntry(entryId);
            if (!ok) {
                json(res, 200, { ok: true, alreadyGone: true });
                return;
            }
            await store.appendChange({
                action: 'delete',
                entryId,
                scope: existing.scope,
                projectHash: existing.projectHash,
                summary: `删除：${summarize(existing.content)}`,
            });
            await compileAll(store, config);
            json(res, 200, { ok: true });
            return;
        }
        if (method === 'POST' && rest === '/meta') {
            const body = await readBody(req);
            const hash = requireString(body.projectHash, 'projectHash');
            const meta = await store.readProjectMeta(hash);
            const next = {
                path: meta?.path ?? (typeof body.path === 'string' && body.path !== '' ? body.path : '手动归属'),
                alias: typeof body.alias === 'string' && body.alias !== '' ? body.alias.slice(0, 64) : (meta?.alias ?? null),
                locked: typeof body.locked === 'boolean' ? body.locked : (meta?.locked ?? true),
                autoMemory: typeof body.autoMemory === 'boolean' ? body.autoMemory : (meta?.autoMemory ?? true),
            };
            await store.writeProjectMeta(hash, next);
            json(res, 200, { ok: true, meta: { ...next, hash } });
            return;
        }
        if (method === 'POST' && rest === '/delete-project') {
            // 按项目清空全部记忆（仅项目层；全局层不动）。
            const body = await readBody(req);
            const projectHash = requireString(body.projectHash, 'projectHash');
            const removed = await store.mutateEntries(entries => {
                const targets = entries.filter(entry => entry.scope === 'project' && entry.projectHash === projectHash);
                for (const target of targets) {
                    entries.splice(entries.indexOf(target), 1);
                }
                return targets;
            });
            for (const entry of removed) {
                await store.appendChange({
                    action: 'delete',
                    entryId: entry.id,
                    scope: entry.scope,
                    projectHash: entry.projectHash,
                    summary: `清空项目：${summarize(entry.content)}`,
                });
            }
            await compileAll(store, config);
            json(res, 200, { ok: true, deleted: removed.length });
            return;
        }
        if (method === 'POST' && rest === '/remember') {
            // 手动添加记忆（面板「添加」）：内容/范围/标签/置顶/重要性。
            const body = await readBody(req);
            const content = typeof body.content === 'string' ? body.content.trim() : '';
            if (content === '')
                throw new Error('content 不能为空');
            const scope = body.scope === 'global' ? 'global' : 'project';
            const projectHash = scope === 'project'
                ? (typeof body.projectHash === 'string' && body.projectHash !== '' ? body.projectHash : null)
                : null;
            if (scope === 'project' && projectHash === null) {
                throw new Error('项目层记忆需要 projectHash（当前无工作区，请用全局或指定项目）');
            }
            const tags = Array.isArray(body.tags)
                ? body.tags.filter((tag) => typeof tag === 'string' && tag.trim() !== '').map(tag => tag.trim()).slice(0, 8)
                : [];
            const importance = typeof body.importance === 'number' && Number.isFinite(body.importance)
                ? Math.max(1, Math.min(10, Math.round(body.importance))) : 8;
            const pinned = body.pinned === true;
            // 项目层首次落盘时确保 meta 存在。
            if (scope === 'project' && projectHash !== null) {
                const meta = await store.readProjectMeta(projectHash);
                if (meta === undefined) {
                    await store.writeProjectMeta(projectHash, {
                        path: typeof body.path === 'string' && body.path !== '' ? body.path : '手动归属',
                        alias: null,
                        locked: false,
                    });
                }
            }
            const beforeEntry = await store.getEntry(entryIdOf(content, scope, scope === 'project' ? projectHash : null));
            const { created, entry } = await store.upsertEntry({
                content,
                scope,
                projectHash: scope === 'project' ? projectHash : null,
                tags,
                importance,
                pinned,
                source: 'manual',
            });
            await store.appendChange({
                action: created ? 'add' : 'update',
                entryId: entry.id,
                scope: entry.scope,
                projectHash: entry.projectHash,
                summary: summarize(entry.content),
                before: beforeEntry?.content,
                after: entry.content,
            });
            await compileAll(store, config);
            json(res, 200, { ok: true, created, entry: toView(entry) });
            return;
        }
        json(res, 404, { error: `no route for ${method} ${rest}` });
    }
    catch (error) {
        json(res, 400, { error: error instanceof Error ? error.message : String(error) });
    }
    finally {
        void store.appendExtractLog(`api ${method} ${rest} done ${Date.now() - apiStarted}ms`).catch(() => undefined);
    }
}
/** 面板列表视图（scope/项目/搜索/标签过滤）。 */
async function listView(store, params) {
    const entries = await store.readEntries();
    const scope = params.get('scope');
    const project = params.get('project');
    const q = params.get('q')?.trim().toLowerCase() ?? '';
    const tag = params.get('tag');
    const views = entries
        .filter(entry => {
        if (scope === 'global' && entry.scope !== 'global')
            return false;
        if (scope === 'project' && entry.scope !== 'project')
            return false;
        if (project !== null && project !== '' && entry.projectHash !== project)
            return false;
        if (q !== '') {
            const haystack = `${entry.content} ${entry.tags.join(' ')}`.toLowerCase();
            if (!q.split(/\s+/).every(term => haystack.includes(term)))
                return false;
        }
        if (tag !== null && tag !== '' && !entry.tags.includes(tag))
            return false;
        return true;
    })
        .sort((a, b) => {
        if (a.pinned !== b.pinned)
            return a.pinned ? -1 : 1;
        return b.updatedAt.localeCompare(a.updatedAt);
    })
        .map(toView);
    return { entries: views, projects: await mergeWorkspaces(store, await store.listProjects(entries)) };
}
/**
 * 合并 DSH 工作区注册表：尚无记忆的新工作区也出现在项目列表（entryCount 0），
 * 让「刚建的工作区」在记忆面板立即可见（无需等第一条记忆写入）。
 */
async function mergeWorkspaces(store, projects) {
    const known = new Set(projects.map(project => project.hash));
    for (const workspace of await store.listDshWorkspaces()) {
        const hash = projectHashOf(workspace.path);
        if (!known.has(hash)) {
            projects.push({
                hash,
                path: workspace.path,
                alias: workspace.title,
                locked: false,
                autoMemory: true,
                entryCount: 0,
                pinnedCount: 0,
            });
            known.add(hash);
        }
    }
    projects.sort((a, b) => a.path.localeCompare(b.path));
    return projects;
}
// ── HTTP plumbing（skill-manager 同款） ────────────────────────────────
function isLoopbackAddress(address) {
    if (typeof address !== 'string')
        return false;
    const a = address.toLowerCase();
    if (a === '::1')
        return true;
    const ipv4 = a.startsWith('::ffff:') ? a.slice(7) : a;
    const octets = ipv4.split('.');
    return octets.length === 4 && octets[0] === '127'
        && octets.every(part => /^\d{1,3}$/.test(part) && Number(part) <= 255);
}
function hostNameOf(value) {
    if (typeof value !== 'string')
        return null;
    const host = value.trim().toLowerCase();
    if (host.startsWith('[')) {
        const close = host.indexOf(']');
        if (close <= 1)
            return null;
        const suffix = host.slice(close + 1);
        if (suffix !== '' && !/^:\d+$/.test(suffix))
            return null;
        return host.slice(1, close);
    }
    const firstColon = host.indexOf(':');
    const lastColon = host.lastIndexOf(':');
    if (firstColon !== lastColon)
        return null;
    return firstColon === -1 ? host : host.slice(0, firstColon);
}
function loopbackAllowed(req) {
    if (!isLoopbackAddress(req.socket.remoteAddress))
        return false;
    const host = hostNameOf(req.headers.host);
    if (host === null)
        return false;
    return host === 'localhost' || host === '127.0.0.1' || host === '::1';
}
function json(res, status, value) {
    const body = JSON.stringify(value);
    res.writeHead(status, {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-cache',
    });
    res.end(body);
}
function readBody(req) {
    return new Promise((resolvePromise, reject) => {
        const chunks = [];
        let size = 0;
        req.on('data', (chunk) => {
            size += chunk.length;
            if (size > 4 * 1024 * 1024) {
                reject(new Error('request body too large'));
                req.destroy();
                return;
            }
            chunks.push(chunk);
        });
        req.on('end', () => {
            if (chunks.length === 0) {
                resolvePromise({});
                return;
            }
            try {
                resolvePromise(JSON.parse(Buffer.concat(chunks).toString('utf8')));
            }
            catch (error) {
                reject(error instanceof Error ? error : new Error('invalid JSON body'));
            }
        });
        req.on('error', reject);
    });
}
function requireString(value, name) {
    if (typeof value !== 'string' || value.trim() === '') {
        throw new Error(`${name} 不能为空`);
    }
    return value.trim();
}
/** 供其它模块使用的工具函数（变更时间）。 */
export function apiNow() {
    return nowIso();
}
/** mergeTags 复用导出（tools.ts 已用本地实现，此处仅为 API 一致性保留）。 */
export { mergeTags };
/**
 * 整合当前工作区记忆：读 scope 内全部条目 → 调当前模型去重/精简/合并 →
 * 写回（合并保留 keep 条目并更新内容、删除被合并条目、新增补充条目）。
 * 返回操作摘要。
 */
async function consolidateMemory(ctx, store, body) {
    const llm = ctx.get('llm');
    if (llm === undefined)
        throw new Error('llm 服务不可用');
    // 模型路由：body 显式 provider/model 优先，否则当前默认模型。
    let provider = typeof body.provider === 'string' ? body.provider.trim() : '';
    let model = typeof body.model === 'string' ? body.model.trim() : '';
    if (provider === '' || model === '') {
        const defaultModel = ctx.get('agentDefaultModel');
        const selection = defaultModel?.currentSelection?.();
        provider = selection?.provider ?? '';
        model = selection?.model ?? '';
    }
    if (provider === '' || model === '')
        throw new Error('无法确定当前模型');
    // 读取目标条目（scope: project 过滤到指定项目，否则全部项目 + 全局）。
    const scopeParam = body.scope === 'global' ? 'global' : body.scope === 'project' ? 'project' : undefined;
    const projectParam = typeof body.projectHash === 'string' && body.projectHash !== '' ? body.projectHash : undefined;
    const all = await store.readEntries();
    const entries = all.filter(entry => {
        if (scopeParam === 'global')
            return entry.scope === 'global';
        if (scopeParam === 'project') {
            return entry.scope === 'project' && (projectParam === undefined || entry.projectHash === projectParam);
        }
        return true;
    });
    if (entries.length <= 1)
        return { removed: 0, updated: 0, added: 0, message: '记忆条目过少，无需整合' };
    // 组装输入文本（id + 内容 + 标签 + 置顶）。
    const input = entries.map(entry => `${entry.id}\t${entry.pinned ? '[置顶] ' : ''}${entry.content}${entry.tags.length > 0 ? ` [${entry.tags.join(',')}]` : ''}`).join('\n');
    const system = [
        'You are a memory curator. Consolidate the given memory entries:',
        '- Merge entries that describe the same fact/preference/project context into ONE entry, keeping all key information.',
        '- Remove redundant or duplicate entries.',
        '- Keep the original language (Chinese if Chinese).',
        '- Each merged entry must keep the MOST IMPORTANT existing id (keepId); mark ids to remove in removeIds.',
        '- Output ONLY JSON: {"merges":[{"keepId":"...","removeIds":["..."],"content":"merged text"}],"additions":[{"content":"...","scope":"global|project","projectHash":null}]}.',
        '- additions are optional new consolidated entries that fit no existing id; scope/projectHash: use "global" with null unless the source entries were project-scoped (then keep "project" and a projectHash from the source).',
        '- Do NOT invent facts. Preserve pinned entries (never remove a pinned id).',
    ].join('\n');
    let output = '';
    let finishFailure = '';
    try {
        for await (const chunk of llm.stream({
            provider,
            model,
            messages: [createUserMessage({
                    content: [{ type: 'text', text: input }],
                    source: { kind: 'plugin', plugin: 'dsh-webui' },
                })],
            system,
            maxTokens: 16_384,
            // JSON 整合不需要思考链：deepseek 系默认关思考，防止思考占满 maxTokens
            // 导致 text 为空（「模型未返回有效 JSON（输出：）」）。
            ...(provider.toLowerCase().includes('deepseek') ? { reasoningEffort: ReasoningEffortId('off') } : {}),
        })) {
            if (chunk.type === 'text-delta')
                output += chunk.text;
            else if (chunk.type === 'finish' && (chunk.reason.kind === 'error' || chunk.reason.kind === 'aborted')) {
                finishFailure = chunk.reason.kind === 'error'
                    ? chunk.reason.failure?.message ?? '模型调用失败'
                    : '模型调用被中止';
            }
        }
    }
    catch (error) {
        throw new Error(`整合调用失败：${error instanceof Error ? error.message : String(error)}`);
    }
    if (finishFailure !== '' && output.trim() === '') {
        throw new Error(`整合调用失败：${finishFailure}`);
    }
    // 解析模型输出 JSON：依次尝试 全文 → 代码围栏 → 首个平衡括号块 → 末尾平衡括号块，
    // 每步都用 JSON.parse 验证（容忍思维链/说明文字混在输出里）。
    const parsePlan = () => {
        const candidates = [];
        const trimmed = output.trim();
        if (trimmed.startsWith('{') && trimmed.endsWith('}'))
            candidates.push(trimmed);
        const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (fence !== null) {
            const inner = fence[1].trim();
            if (inner.startsWith('{') && inner.endsWith('}'))
                candidates.push(inner);
        }
        const balanced = (from) => {
            let depth = 0;
            for (let i = from; i < output.length; i++) {
                const ch = output[i];
                if (ch === '{')
                    depth++;
                else if (ch === '}') {
                    depth--;
                    if (depth === 0)
                        return output.slice(from, i + 1);
                }
            }
            return null;
        };
        const first = output.indexOf('{');
        if (first !== -1) {
            const block = balanced(first);
            if (block !== null)
                candidates.push(block);
        }
        const last = output.lastIndexOf('{');
        if (last !== -1 && last !== first) {
            const block = balanced(last);
            if (block !== null)
                candidates.push(block);
        }
        for (const candidate of candidates) {
            try {
                return JSON.parse(candidate);
            }
            catch {
                // 尝试下一个候选。
            }
        }
        const preview = output.length > 160 ? `${output.slice(0, 160)}…` : output;
        throw new Error(`模型未返回有效 JSON（输出：${preview.replace(/\s+/g, ' ')}）`);
    };
    const plan = parsePlan();
    const pinnedIds = new Set(entries.filter(entry => entry.pinned).map(entry => entry.id));
    let removed = 0;
    let updated = 0;
    let added = 0;
    // 合并：更新 keep 条目内容，删除被合并条目（置顶的绝不删）。
    for (const merge of plan.merges ?? []) {
        const keepId = merge.keepId;
        if (merge.content !== undefined && merge.content.trim() !== '' && entries.some(entry => entry.id === keepId)) {
            const patched = await store.patchEntry(keepId, { content: merge.content.trim() });
            if (patched !== undefined)
                updated++;
        }
        for (const removeId of merge.removeIds ?? []) {
            if (pinnedIds.has(removeId))
                continue;
            if (await store.removeEntry(removeId))
                removed++;
        }
    }
    // 新增补充条目。
    for (const addition of plan.additions ?? []) {
        if (typeof addition.content !== 'string' || addition.content.trim() === '')
            continue;
        await store.upsertEntry({
            content: addition.content.trim(),
            scope: addition.scope === 'project' ? 'project' : 'global',
            projectHash: addition.scope === 'project' && typeof addition.projectHash === 'string'
                ? addition.projectHash
                : null,
        });
        added++;
    }
    // 整合成功后留快照（整合前的全量条目），供「撤回整合」恢复；DSH 重启即失效。
    consolidateUndo = { at: nowIso(), entries: all };
    await compileAll(store, { compileThreshold: 30, injectTokenBudget: 2000 })
        .catch(() => undefined);
    return {
        removed,
        updated,
        added,
        message: `整合完成：更新 ${updated}、删除 ${removed}、新增 ${added}`,
    };
}
//# sourceMappingURL=api.js.map