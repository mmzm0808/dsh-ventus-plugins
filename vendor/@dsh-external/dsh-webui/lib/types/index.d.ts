/**
 * webui — 会话 Web UI 插件（host 半身，自定义裁剪版）。
 *
 * 仅装配用户选择的能力：
 *  1. `webui_sync_reasoning` 工具：内置「供应商级推理等级模板」，为
 *     `llm-pi-ai` 中缺失 `reasoningEfforts` 的模型自动补全。
 *  2. 中文思考开关（dsh-zh-thinking）。
 *  3. 网络代理（dsh-proxy）。
 *  4. AI 浏览器（dsh-browser）。
 *  5. 本地记忆引擎（dsh-memory）。
 *  6. 用量统计 + 技能管理（dsh-usage-skill 融合）。
 */
import type { Context } from 'cordis';
export declare const name = "dsh-webui";
export declare const inject: string[];
/** webui 组合配置：仅保留已选能力的可选子配置。 */
export interface WebuiConfig {
    browser?: Partial<import('./browser/index.js').Config>;
    memory?: Partial<import('./memory/types.js').MemoryConfig>;
    /** 用量统计 + 技能管理配置（透传给 dsh-usage-skill 的 host）。 */
    usage?: any;
}
/**
 * 注册 `webui_sync_reasoning` 工具 + 中文思考开关 + 网络代理 + AI 浏览器
 * + 本地记忆引擎 + 用量统计/技能管理。
 * @param ctx - host 上下文。
 * @param config - 组合配置（默认空对象，各能力自带默认值）。
 */
export declare function apply(ctx: Context, config?: WebuiConfig): Promise<void>;
