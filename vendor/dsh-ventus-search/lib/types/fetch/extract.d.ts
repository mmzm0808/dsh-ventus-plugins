/**
 * Lightweight Readability-style article extraction: pick the best container
 * (article/main/role=main/class heuristics), strip chrome, and fall back to
 * whole-page text when no readable block is found.
 * @module dsh-ventus-search/fetch/extract
 */
import type { WebFetchBody } from '@deepseek-ai/dsh-web';
/**
 * Extract a readable body from an HTML document.
 * @param html - the raw decoded HTML document.
 * @param url - the page URL (used only for diagnostics/fallback messages).
 * @returns an html-kind body with the extracted container, or a text-kind body
 *   with the whole page text when no readable container exists.
 */
export declare function extractReadable(html: string, url: string): WebFetchBody;
