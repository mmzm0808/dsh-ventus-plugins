/**
 * The Ventus multi-engine search provider (id 'ventus-search'). Runs the
 * enabled engines concurrently with a bounded pool, honors the external
 * AbortSignal and an overall deadline, retries transient failures, degrades
 * gracefully, and caches results per normalized query.
 * @module dsh-ventus-search/search/provider
 */
import type { WebSearchProvider, WebSearchRequest, WebSearchResult } from '@deepseek-ai/dsh-web';
import type { StateStore } from '../state.js';
/** Resolved search-side options (mapped from plugin config by the host entry). */
export interface VentusSearchOptions {
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
    cacheEnabled: boolean;
}
/** Stable search provider id registered into ctx.web. */
export declare const VENTUS_SEARCH_PROVIDER_ID = "ventus-search";
/** The Ventus search provider. */
export declare class VentusSearchProvider implements WebSearchProvider {
    private readonly options;
    private readonly state;
    readonly id = "ventus-search";
    private readonly cache;
    constructor(options: VentusSearchOptions, state: StateStore);
    /** Cheap local usability check: the persisted master switch. */
    available(): boolean;
    search(request: WebSearchRequest, signal?: AbortSignal): Promise<WebSearchResult>;
    /** Execute all engine passes under one overall deadline and assemble results. */
    private runSearch;
    private engineOptions;
    /** One pass over the enabled engines, then fallback passes if results are too few. */
    private collectPasses;
    /** One engine pass: bounded pool, per-engine retries, health write-back. */
    private runPass;
}
