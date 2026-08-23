/** 从文本中提取并校验 progress-json 块。 */
import type { ProgressModel } from '../shared/progress-types.js';
/** 提取文本中第一个合法的 progress-json 块；无则返回 null。 */
export declare function extractProgressJson(text: string): ProgressModel | null;
/** 校验并归一化进度模型；非法返回 null。 */
export declare function normalizeProgress(value: unknown): ProgressModel | null;
