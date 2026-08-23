import type { Context } from '@deepseek-ai/cordis';
import '@deepseek-ai/dsh-host-webserver';
export declare const name = "dsh-ventus-progress";
export declare const inject: string[];
export interface Config {
    /** 非完成进度超过此时长（ms）视为过期清理。 */
    fallbackTimeoutMs?: number;
    /** 周期清理间隔（ms）。 */
    cleanupIntervalMs?: number;
}
export declare function apply(ctx: Context, config?: Config): void;
