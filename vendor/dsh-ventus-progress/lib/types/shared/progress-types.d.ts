/** 阶段状态。 */
export type StageStatus = 'pending' | 'running' | 'completed' | 'failed';
/** 单个阶段。 */
export interface ProgressStage {
    id: string;
    label: string;
    weight: number;
    status: StageStatus;
    subPercent: number;
    runningCondition?: string;
    doneCondition?: string;
}
/** AI 上报的进度模型（对应 schema/progress.schema.json）。 */
export interface ProgressModel {
    taskId: string;
    taskName: string;
    percent: number;
    currentText: string;
    finished: boolean;
    stages: ProgressStage[];
}
/** Host 存储的进度状态（模型 + 时间戳 + 解析错误计数）。 */
export interface ProgressSnapshot {
    subagentId: string;
    model: ProgressModel;
    updatedAt: number;
    parseErrors: number;
}
/** 客户端查询的进度列表（每个子代理一条）。 */
export interface ProgressListEntry {
    subagentId: string;
    taskId: string;
    taskName: string;
    percent: number;
    currentText: string;
    finished: boolean;
    stages: ProgressStage[];
    updatedAt: number;
}
