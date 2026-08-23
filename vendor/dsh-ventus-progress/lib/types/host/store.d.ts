/** 按 subagentId 分桶的进度状态存储。 */
import type { ProgressModel, ProgressListEntry, ProgressSnapshot } from '../shared/progress-types.js';
export declare class ProgressStore {
    private readonly fallbackTimeoutMs;
    private readonly bySubagent;
    constructor(fallbackTimeoutMs: number);
    /** 记录一次上报（覆盖该子代理的最新进度）。 */
    set(subagentId: string, model: ProgressModel, now?: number): void;
    /** 记录一次解析错误（保留上次快照）。 */
    markParseError(subagentId: string, now?: number): void;
    get(subagentId: string): ProgressSnapshot | undefined;
    /** 所有未过期进度（客户端列表用）。 */
    list(now?: number): ProgressListEntry[];
    /** 移除指定子代理的进度（子代理结束/清理）。 */
    remove(subagentId: string): void;
    /** 清理超时未更新的非完成进度。 */
    expire(now?: number): void;
    /** 全部清空（HMR/重启兜底）。 */
    clear(): void;
}
/** 构造进度存储实例。 */
export declare function createProgressStore(fallbackTimeoutMs: number): ProgressStore;
