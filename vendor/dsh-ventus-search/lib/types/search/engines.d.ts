/**
 * Search engine adapters: Bing (HTML), 360 so.com (HTML, two entry variants),
 * and the Bilibili search JSON API. Each adapter honors an external AbortSignal
 * plus its own per-attempt timeout, and returns plain RawSource items; redirect
 * wrappers are decoded later by scoring.ts.
 * @module dsh-ventus-search/search/engines
 */
/** Engine ids recognized by the health state. */
export type EngineId = 'bing' | 'so360' | 'bilibili';
/** One raw search hit before scoring/dedupe. */
export interface RawSource {
    url: string;
    title: string;
    snippet?: string;
    publishedAt?: string;
    rank: number;
}
/** Per-engine search options (all resolved from plugin config by the provider). */
export interface EngineSearchOptions {
    /** Maximum sources to keep from this engine. */
    maxResults: number;
    /** External cancellation signal (also carries the overall deadline). */
    signal: AbortSignal;
    /** Per-attempt request timeout in milliseconds. */
    timeoutMs: number;
    /** Optional Bilibili cookie; empty falls back to a default buvid3. */
    bilibiliCookie?: string;
}
/** Error the provider may retry (429 / 5xx / request timeout). */
export declare class RetryableError extends Error {
}
/** Bing web (or news) search. */
export declare function bingSearch(query: string, opts: EngineSearchOptions): Promise<RawSource[]>;
/** 360 so.com search with two entry variants as redundancy. */
export declare function so360Search(query: string, opts: EngineSearchOptions): Promise<RawSource[]>;
/** Bilibili video search through the public search/all/v2 JSON API. */
export declare function bilibiliSearch(query: string, opts: EngineSearchOptions): Promise<RawSource[]>;
/** The engine adapter table keyed by stable engine id. */
export declare const ENGINE_ADAPTERS: Record<EngineId, (query: string, opts: EngineSearchOptions) => Promise<RawSource[]>>;
