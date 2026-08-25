/**
 * dsh-ventus-research — .rb-state.json 唯一可信源的持久化层。
 *
 * 设计稿 4.1 / 4.5：schema rb/1；根目录契约
 * `LaTeXDoc/<Topic>_<YYMMDD>/{sim,data,figs,notes}`。写盘用原子发布
 * （同目录 tmp + fsync + rename，照抄 storage-json/src/atomic.ts 语义），
 * 读改写在同一同步块内完成——node 单线程下天然串行，避免并发交错覆盖。
 */
import { createHash, randomBytes } from 'node:crypto';
import { closeSync, existsSync, fsyncSync, mkdirSync, openSync, readdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
/** 状态文件名（设计稿唯一可信源）。 */
export const STATE_FILE = '.rb-state.json';
/** 目录契约（设计稿基线）。 */
export const TOPIC_DIRS = ['sim', 'data', 'figs', 'notes'];
/** notes 下的子目录。 */
export const NOTES_SUBDIRS = ['derivations'];
/** 目录契约内的根目录路径。 */
export function topicRoot(cwd, topic) {
    return join(cwd, 'LaTeXDoc', topic);
}
/** 原子写（同目录 tmp + fsync + rename）。 */
function atomicWriteJson(file, content) {
    const dir = join(file, '..');
    mkdirSync(dir, { recursive: true });
    const tmp = join(dir, `.${basename(file)}.${randomBytes(6).toString('hex')}.tmp`);
    const fd = openSync(tmp, 'wx', 0o600);
    try {
        writeFileSync(fd, content, 'utf8');
        fsyncSync(fd);
    }
    finally {
        closeSync(fd);
    }
    renameSync(tmp, file);
}
/** 读取状态；不存在或解析失败返回 null（trust: low 由调用方判断）。 */
export function readState(root) {
    const file = join(root, STATE_FILE);
    if (!existsSync(file))
        return null;
    try {
        const parsed = JSON.parse(readFileSync(file, 'utf8'));
        if (!isRbState(parsed))
            return null;
        return parsed;
    }
    catch {
        return null;
    }
}
/** 简单结构校验：schema 字段 + 关键数组存在。 */
function isRbState(value) {
    if (typeof value !== 'object' || value === null)
        return false;
    const v = value;
    return v.schema === 'rb/1'
        && typeof v.topic === 'string'
        && typeof v.root === 'string'
        && Array.isArray(v.conventions)
        && Array.isArray(v.claims)
        && Array.isArray(v.assets)
        && Array.isArray(v.evidence)
        && Array.isArray(v.adjudications)
        && Array.isArray(v.buildLog)
        && Array.isArray(v.opsLog)
        && Array.isArray(v.pendingMemory);
}
/** 写盘（原子发布）。 */
export function writeState(root, state) {
    atomicWriteJson(join(root, STATE_FILE), `${JSON.stringify(state, null, 2)}\n`);
}
/** 全新状态（设计稿 4.1 缺省形状）。 */
export function createEmptyState(topic, root) {
    return {
        schema: 'rb/1',
        topic,
        root,
        conventions: [],
        claims: [],
        assets: [],
        evidence: [],
        adjudications: [],
        buildLog: [],
        opsLog: [],
        pendingMemory: [],
    };
}
/** 建立目录契约结构（幂等）。 */
export function ensureTopicDirs(root) {
    for (const dir of TOPIC_DIRS)
        mkdirSync(join(root, dir), { recursive: true });
    for (const sub of NOTES_SUBDIRS)
        mkdirSync(join(root, 'notes', sub), { recursive: true });
}
/** 下一个 claim 编号（C-001、C-002…，按现有最大号 +1）。 */
export function nextClaimId(state) {
    let max = 0;
    for (const claim of state.claims) {
        const n = /^C-(\d+)$/u.exec(claim.id)?.[1];
        if (n !== undefined)
            max = Math.max(max, Number(n));
    }
    return `C-${String(max + 1).padStart(3, '0')}`;
}
/** 下一个证据编号（E-001…）。 */
export function nextEvidenceId(state) {
    let max = 0;
    for (const entry of state.evidence) {
        const n = /^E-(\d+)$/u.exec(entry.id)?.[1];
        if (n !== undefined)
            max = Math.max(max, Number(n));
    }
    return `E-${String(max + 1).padStart(3, '0')}`;
}
/** 下一个资产编号（asset-<kind>-001…）。 */
export function nextAssetId(state, kind) {
    let max = 0;
    for (const asset of state.assets) {
        const n = new RegExp(`^asset-${kind}-(\\d+)$`, 'u').exec(asset.id)?.[1];
        if (n !== undefined)
            max = Math.max(max, Number(n));
    }
    return `asset-${kind}-${String(max + 1).padStart(3, '0')}`;
}
/** 查 claim。 */
export function findClaim(state, id) {
    return state.claims.find(claim => claim.id === id);
}
/** 查口径声明。 */
export function findConvention(state, id) {
    return state.conventions.find(c => c.id === id);
}
/** 文件 SHA-256（资产登记用）。 */
export function sha256File(file) {
    const data = readFileSync(file);
    return createHash('sha256').update(data).digest('hex');
}
/** 资产扫描（设计稿 4.5）：只找「未登记」候选，hash 去重。 */
export function scanAssets(root, state) {
    const known = new Set(state.assets.map(asset => asset.path));
    const pending = [];
    const seenHashes = new Set(state.assets.map(asset => asset.hash));
    const consider = (path, kind) => {
        const rel = path.replaceAll('\\', '/');
        if (known.has(rel))
            return;
        let hash = '';
        try {
            hash = sha256File(path);
        }
        catch {
            return;
        }
        if (seenHashes.has(hash))
            return;
        seenHashes.add(hash);
        pending.push({ path: rel, kind, hash });
    };
    for (const name of readDirSafe(join(root, 'sim'))) {
        if (name.startsWith('py_') && name.endsWith('.py'))
            consider(join(root, 'sim', name), 'verifier');
    }
    for (const name of readDirSafe(join(root, 'notes', 'derivations'))) {
        if (name.endsWith('.md'))
            consider(join(root, 'notes', 'derivations', name), 'derivation');
    }
    for (const name of readDirSafe(join(root, 'notes'))) {
        if (name.startsWith('evidence_') && name.endsWith('.md'))
            consider(join(root, 'notes', name), 'evidence-card');
    }
    return pending;
}
/** 目录不存在时返回空数组。 */
function readDirSafe(dir) {
    try {
        return readdirSync(dir);
    }
    catch {
        return [];
    }
}
/** 追加一条操作日志（就地）。 */
export function pushOpLog(state, action, by, detail, claimId) {
    state.opsLog.push({
        at: new Date().toISOString(),
        action,
        by,
        ...(claimId === undefined ? {} : { claimId }),
        ...(detail === undefined ? {} : { detail }),
    });
}
/** ISO 本地时间戳（含 ±HH:MM 偏移）。 */
export function localIso() {
    const now = new Date();
    const offsetMs = -now.getTimezoneOffset() * 60_000;
    const local = new Date(now.getTime() + offsetMs);
    const iso = local.toISOString().replace('Z', '');
    const sign = offsetMs >= 0 ? '+' : '-';
    const hours = String(Math.floor(Math.abs(offsetMs) / 3_600_000)).padStart(2, '0');
    const minutes = String(Math.floor((Math.abs(offsetMs) % 3_600_000) / 60_000)).padStart(2, '0');
    return `${iso}${sign}${hours}:${minutes}`;
}
//# sourceMappingURL=state.js.map