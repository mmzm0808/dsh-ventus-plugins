import type { Context } from '@deepseek-ai/cordis';
import { type TolBand } from './gates.js';
/** 工具注册所需的宿主上下文。 */
export interface BenchEnv {
    /** tol class → 阈值带（config 提供，缺省 A/B/C）。 */
    tolClasses: Record<string, TolBand>;
}
/** 注册全部 7 个工具；返回各注册的 disposer。 */
export declare function registerBenchTools(ctx: Context, env: BenchEnv): Array<() => void>;
/** 设置当前课题根（index.ts 用 /research-bench/sign 也可用）。 */
export declare function setCurrentBenchRoot(root: string | null): void;
/** 取当前课题根。 */
export declare function getCurrentBenchRoot(): string | null;
