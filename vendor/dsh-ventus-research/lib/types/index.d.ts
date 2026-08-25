import type { Context } from '@deepseek-ai/cordis';
import type { WebServer } from '@deepseek-ai/dsh-host-webserver';
import z from 'schemastery';
/** 稳定 cordis 插件名（匹配 cordis.patch.yml insert id）。 */
export declare const name = "dsh-ventus-research";
/** 必需服务：工具注册（webServer 可选，见 apply——headless 无 HTTP 时跳过 sign 路由）。 */
export declare const inject: string[];
/** 插件配置。 */
export interface Config {
    /** tol class 误差档位覆盖（key=档位名，value={pass,warn}）。 */
    tolClasses: Record<string, {
        pass: number;
        warn: number;
    }>;
}
export declare const Config: z<Config>;
type AppContext = Context & {
    webServer: WebServer;
};
export declare function apply(ctx: AppContext, config: Config): void;
export {};
