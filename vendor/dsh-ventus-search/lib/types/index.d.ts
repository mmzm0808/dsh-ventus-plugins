/**
 * dsh-ventus-search — host half. Registers a multi-engine search provider and a
 * fetch provider into ctx.web, plus loopback-only state routes backing the
 * settings card (master switch + per-engine health). All routes/providers are
 * effect-owned and clean up with the fiber.
 * @module dsh-ventus-search
 */
import type { Context } from '@deepseek-ai/cordis';
import z from 'schemastery';
/** Stable cordis plugin name (matches cordis.patch.yml insert id). */
export declare const name = "ventus-search";
/** Services required before the providers and routes can mount. */
export declare const inject: string[];
/** Plugin config (all fields defaulted by the schemastery schema). */
export interface Config {
    /** Master switch, persisted to the state file and changeable from the settings card. */
    enabled: boolean;
    /** State file path; a leading ~ is expanded to the user's home directory. */
    stateFilePath: string;
    engines: {
        bing: boolean;
        so360: boolean;
        bilibili: boolean;
        bilibiliCookie: string;
    };
    maxResults: number;
    maxDomainResults: number;
    requestTimeoutMs: number;
    overallTimeoutMs: number;
    maxConcurrency: number;
    retryCount: number;
    gracefulDegradation: boolean;
    cache: {
        enabled: boolean;
    };
    fetch: {
        enabled: boolean;
        blockedDomains: string[];
        mirrorDomains: Record<string, string[]>;
    };
}
export declare const Config: z<Config>;
/** Register the plugin. */
export declare function apply(ctx: Context, config: Config): void;
