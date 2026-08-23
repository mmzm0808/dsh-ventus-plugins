/**
 * dsh-ventus-progress — 子代理任务进度显示插件（client 半身）。
 *
 * 不再占用顶栏按钮：直接在子代理下拉框（SubagentCatalogAction 的
 * treeitem）上监听悬停，右侧浮窗展示该子代理的进度（分段条/最终状态），
 * 无进度则显示「当前子代理尚无进度任务」。数据经 /api/ventus-progress/list
 * 轮询 host。
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client';
export declare const inject: string[];
export declare function apply(ctx: ClientContext): void;
