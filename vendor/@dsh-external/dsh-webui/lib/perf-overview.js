/**
 * dsh-ventus-plugins 性能概览（host 半身）。
 *
 * /api/ventus-perf 返回整合包各子插件的「性能占用」（模块产物体积 bytes，
 * 相对最大者 100%）。供侧边栏「性能」栏目渲染进度条 + 百分比/大小切换。
 */
import { readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
/** 定位整合包包根：本模块在 <root>/vendor/@dsh-external/dsh-webui/lib/，上溯四级。 */
function locateIntegrationRoot() {
    const here = dirname(fileURLToPath(import.meta.url));
    const root = join(here, '..', '..', '..', '..');
    const hostEntry = join(root, 'lib', 'index.js');
    const vendor = join(root, 'vendor');
    if (!existsSync(hostEntry) || !existsSync(vendor))
        return null;
    return root;
}
/** 各功能：名称（2-5 字）→ 整合包 vendor 相对目录。 */
const PERF_SUBS = [
    { name: '核心 UI', rel: 'vendor/@dsh-external/dsh-webui' },
    { name: '右侧栏', rel: 'vendor/dsh-better-sidebar' },
    { name: '用量', rel: 'vendor/dsh-deepseek-usage' },
    { name: '主题', rel: 'vendor/dsh-theme-endfield' },
    { name: '搜索', rel: 'vendor/dsh-ventus-search' },
    { name: '桌宠', rel: 'vendor/dsh-ventus-whale' },
    { name: '进度', rel: 'vendor/dsh-ventus-progress' },
    { name: '科研', rel: 'vendor/dsh-ventus-research' },
    { name: '上下文', rel: 'vendor/dsh-context' },
    { name: '注入', rel: 'vendor/@dsh-external/dsh-super-injector' },
    { name: '可视化', rel: 'vendor/@dsh-external/dsh-visualize' },
    { name: '权限', rel: 'vendor/@nanmicoder/dsh-auto-mode' },
];
/** 测量一个子插件产物目录的总体积（bytes）。 */
function measureBytes(dir) {
    let total = 0;
    const stack = [dir];
    while (stack.length > 0) {
        const cur = stack.pop();
        let names = [];
        try {
            names = readdirSync(cur);
        }
        catch {
            continue;
        }
        for (const name of names) {
            if (name === 'node_modules' || name.endsWith('.map'))
                continue;
            const full = join(cur, name);
            try {
                const st = statSync(full);
                if (st.isDirectory())
                    stack.push(full);
                else if (st.isFile())
                    total += st.size;
            }
            catch { /* 忽略不可读 */ }
        }
    }
    return total;
}
export function collectPerf() {
    const root = locateIntegrationRoot();
    if (root === null)
        return [];
    const items = PERF_SUBS
        .map(sub => ({ name: sub.name, bytes: measureBytes(join(root, sub.rel)) }))
        .filter(item => item.bytes > 0)
        .sort((a, b) => b.bytes - a.bytes);
    const max = items.length > 0 ? items[0].bytes : 1;
    return items.map(item => ({ name: item.name, bytes: item.bytes, percent: Math.round((item.bytes / max) * 100) }));
}
export async function perfHandler(req, res) {
    res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
    res.end(JSON.stringify({ ok: true, items: collectPerf() }));
}
//# sourceMappingURL=perf-overview.js.map