/**
 * Result-quality scoring, redirect-wrapper decoding, URL normalization, and
 * dedupe for Ventus Search. Pure functions shared by every engine pass.
 * @module dsh-ventus-search/search/scoring
 */
import type { RawSource } from './engines.js';
/** One source plus its computed relevance score. */
export interface ScoredSource extends RawSource {
    score: number;
}
/**
 * Decode a search-engine redirect-wrapper URL (Bing /ck/a?a...&u=..., 360 /link
 * with a url param, and the a1%3a%2f%2f base64url form) into the real URL.
 * Returns undefined when the input is not a decodable wrapper.
 */
export declare function decodeRedirectUrl(raw: string): string | undefined;
/**
 * Normalize a URL for dedupe: decode redirect wrappers, lowercase the host,
 * drop default ports, strip tracking parameters and the fragment, and trim a
 * bare root path. Returns undefined for unusable (non-http(s)) URLs.
 */
export declare function normalizeUrl(raw: string): string | undefined;
/**
 * Score every source (title hit *3 + snippet hit *2 - rank position), dedupe by
 * normalized URL keeping the best-scored entry, cap results per hostname, and
 * sort by score desc then rank asc. Display URLs are the decoded real URLs.
 */
export declare function rankAndDedupe(sources: readonly RawSource[], query: string, maxDomainResults: number): ScoredSource[];
/** Count distinct normalized URLs (used to decide whether a fallback pass is needed). */
export declare function distinctUrlCount(sources: readonly RawSource[]): number;
