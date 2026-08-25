import { defineTool } from '@deepseek-ai/dsh-tools';
import { settingsNamespace } from '@deepseek-ai/dsh-settings';
import { spawn } from 'node:child_process';
import { applyZhThinking } from './zh-thinking.js';
import { applyProxy } from './proxy.js';
import { applyBrowser } from './browser/index.js';
import { applyMemory } from './memory/index.js';
import { applyUsageHost } from './usage-host.js';
import { applyPromptOptimize } from './prompt-optimize.js';
import { applySidebarFloat } from './sidebar-float.js';
import { apply as applySkillToggles } from './skill-toggles.js';
// 会话增强模块（statem-li/dsh-webui 增量）：
import { applyScreenshot as applyScreenshotHost } from './screenshot.js';
import { applyRewind as applyRewindHost } from './rewind.js';
import { applyDonePill as applyDonePillHost } from './done-pill.js';
import { applyVisionHelper } from './vision-helper.js';
import { applyPerfBench } from './perf-bench.js';
import { perfHandler } from './perf-overview.js';
import { applyModulesHost } from './modules-host.js';
import { applyFileExplorer as applyFileExplorerHost } from './file-explorer.js';
export const name = 'dsh-webui';
export const inject = ['settings', 'tools', 'web', 'systemPrompt', 'webServer', 'sandboxPolicy', 'fs', 'workspaceRegistry', 'credentials', 'sessions', 'sessionPersistence', 'llm', 'shell'];
// ── 推理等级补全 ────────────────────────────────────────────────────────────
/** 供应商级推理等级模板：等级名 → 发送给该供应商的线值（string 或 null）。 */
const PROVIDER_REASONING_TEMPLATES = {
    // anthropic-messages：思考用 thinking 块 + effort 字符串
    sensenova: { off: 'none', low: 'low', medium: 'medium', high: 'high', xhigh: 'xhigh' },
    agnes: { off: 'none', low: 'low', medium: 'medium', high: 'high', max: 'max' },
    // openai-completions：reasoning_effort 参数；off 省略参数
    rhythm: { off: null, low: 'low', medium: 'medium', high: 'high', xhigh: 'xhigh', max: 'max' },
    bai: { off: null, low: 'low', medium: 'medium', high: 'high', xhigh: 'xhigh', max: 'max' },
    pl: { off: null, low: 'low', high: 'high', xhigh: 'max' },
};
/**
 * 注册 `webui_sync_reasoning` 工具 + 中文思考开关 + 网络代理 + AI 浏览器
 * + 本地记忆引擎 + 用量统计/技能管理。
 * @param ctx - host 上下文。
 * @param config - 组合配置（默认空对象，各能力自带默认值）。
 */
export async function apply(ctx, config = {}) {
    // 0) 模块开关（settings.yaml 持久化 + /api/webui-modules）：
    //    返回本次启动生效的全量布尔表，为 false 的模块完全不装配。
    const modules = applyModulesHost(ctx);
    // 1) 推理等级自动补全工具。
    ctx.tools.register(defineTool({
        name: 'webui_sync_reasoning',
        description: '为 settings 里 llm-pi-ai 各供应商中缺失 reasoningEfforts（推理等级）的模型，按内置供应商级模板自动补全，免去手工编辑 settings.yaml。已有配置或未收录供应商不受影响。',
        parameters: {},
        output: {
            schema: {
                type: 'object',
                additionalProperties: false,
                properties: {
                    patched: { type: 'array', required: true, items: { type: 'string' } },
                    skipped: { type: 'array', required: true, items: { type: 'string' } },
                },
            },
            render: (_args, value) => [{
                    type: 'text',
                    text: `已补全 ${value.patched.length} 个模型的推理等级：${value.patched.join(', ') || '(无)'}。` +
                        `跳过 ${value.skipped.length} 个：${value.skipped.join(', ') || '(无)'}。`,
                }],
        },
        async execute() {
            const ns = settingsNamespace('llm-pi-ai');
            const raw = ctx.settings.get(ns);
            const providers = raw?.providers;
            const patched = [];
            const skipped = [];
            if (providers === undefined)
                return { patched, skipped };
            let changed = false;
            const nextProviders = {};
            for (const [providerId, provider] of Object.entries(providers)) {
                const template = PROVIDER_REASONING_TEMPLATES[providerId];
                const models = Array.isArray(provider?.models) ? provider.models : [];
                if (template === undefined || models.length === 0) {
                    nextProviders[providerId] = provider;
                    continue;
                }
                const nextModels = models.map((model) => {
                    const id = typeof model.id === 'string' ? model.id : '';
                    if (model.reasoningEfforts !== undefined)
                        return model;
                    if (id === '') {
                        skipped.push(`${providerId}/<无 id>`);
                        return model;
                    }
                    patched.push(`${providerId}/${id}`);
                    changed = true;
                    return { ...model, reasoningEfforts: { ...template } };
                });
                nextProviders[providerId] = { ...provider, models: nextModels };
            }
            if (changed) {
                await ctx.settings.update(ns, { providers: nextProviders });
            }
            return { patched, skipped };
        },
        presentCall: () => ({ card: 'generic', title: '同步模型推理等级', kind: 'other', rawInput: null }),
    }));
    // 2) 中文思考开关（自 dsh-zh-thinking 合并）。
    applyZhThinking(ctx);
    // 3) 网络代理（自 dsh-proxy 合并）。
    applyProxy(ctx);
    // 4) AI 浏览器操作（自 dsh-browser 合并；config.browser 可选覆盖）。
    applyBrowser(ctx, {
        chromePath: '', port: 0, headless: false, screenshotDir: '',
        ...config.browser,
    });
    // 5) 本地记忆引擎（自 dsh-memory 合并；config.memory 可选覆盖）。
    applyMemory(ctx, config.memory);
    // 6) 用量统计 + 技能管理（自 dsh-usage-skill 融合；host 复用其 lib 产物）。
    await applyUsageHost(ctx, config.usage);
    // 6.5) 技能开关（/api/skill-toggles）：读写 SKILL.md frontmatter 启停技能。
    await applySkillToggles(ctx);
    // 7) 文件浏览器「在资源管理器打开」端点：loopback only，POST { path }。
    ctx.webServer.register({
        kind: 'exact',
        path: '/api/file-explorer/open-in-explorer',
        handler: async (req, res) => {
            if (req.method !== 'POST') {
                res.writeHead(405, { 'content-type': 'application/json' });
                res.end(JSON.stringify({ error: 'POST required' }));
                return;
            }
            try {
                const body = await new Promise((resolve, reject) => {
                    const chunks = [];
                    req.on('data', c => chunks.push(c));
                    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
                    req.on('error', reject);
                });
                const { path: filePath } = JSON.parse(body);
                if (!filePath || typeof filePath !== 'string') {
                    res.writeHead(400, { 'content-type': 'application/json' });
                    res.end(JSON.stringify({ error: 'path required' }));
                    return;
                }
                const isWin = process.platform === 'win32';
                const args = isWin ? ['explorer.exe', '/select,', filePath] : process.platform === 'darwin' ? ['open', filePath] : ['xdg-open', filePath];
                spawn(args[0], args.slice(1), { detached: true, stdio: 'ignore' }).unref();
                res.writeHead(200, { 'content-type': 'application/json' });
                res.end(JSON.stringify({ ok: true }));
            }
            catch (error) {
                res.writeHead(500, { 'content-type': 'application/json' });
                res.end(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }));
            }
        },
    });
    // 8) 提示词优化（/api/webui-prompt-optimize）：对话框内用选中模型优化提示词。
    applyPromptOptimize(ctx);
    // 9) 左侧悬浮侧边栏：设置项「固定侧边栏」持久化 + /api/sidebar-float。
    applySidebarFloat(ctx);
    // 10) 会话增强模块（statem-li/dsh-webui 增量；模块 key 门控，缺省启用）：
    //     对话截图（/api/webui-screenshot）、对话退回（/api/webui-rewind）、
    //     对话完成胶囊（/api/webui-done-pill 记录面板）。
    if (modules.fileExplorer)
        applyFileExplorerHost(ctx);
    if (modules.screenshot)
        applyScreenshotHost(ctx);
    if (modules.rewind)
        applyRewindHost(ctx);
    if (modules.donePill)
        applyDonePillHost(ctx);
    // 11) 辅助视觉 + 生图（合并自 statem-li/dsh-webui 的 vision-helper）：
    //     vision_describe / generate_image / 图片降级 / HTTP 接口。
    if (modules.vision)
        applyVisionHelper(ctx, config.visionHelper ?? {});
    // 12) 供应商性能基准（/api/perf-bench，provider-hub 性能测试弹窗的数据源）。
    applyPerfBench(ctx);
    // 12.5) 整合包性能概览（/api/ventus-perf，侧边栏「性能」栏目数据源）。
    ctx.webServer.register({
        kind: 'exact',
        path: '/api/ventus-perf',
        handler: perfHandler,
    });
}
//# sourceMappingURL=index.js.map