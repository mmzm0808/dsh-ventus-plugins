/**
 * The Ventus fetch provider (id 'ventus-fetch'): URL validation, ad/tracking
 * domain blocklist, UA + signal + timeout, mirror-domain fallback, charset-aware
 * decoding, and Readability-style extraction for HTML responses.
 * @module dsh-ventus-search/fetch/provider
 */
import type { WebFetchProvider, WebFetchRequest, WebFetchResult } from '@deepseek-ai/dsh-web';
/** Stable fetch provider id registered into ctx.web (avoids the official 'http' id). */
export declare const VENTUS_FETCH_PROVIDER_ID = "ventus-fetch";
/** Resolved fetch-side options (mapped from plugin config by the host entry). */
export interface VentusFetchOptions {
    enabled: boolean;
    blockedDomains: string[];
    mirrorDomains: Record<string, string[]>;
    timeoutMs: number;
}
/** The Ventus fetch provider. */
export declare class VentusFetchProvider implements WebFetchProvider {
    private readonly options;
    private readonly masterEnabled;
    readonly id = "ventus-fetch";
    constructor(options: VentusFetchOptions, masterEnabled: () => boolean);
    /** Cheap local usability check: fetch enabled in config and the master switch on. */
    available(): boolean;
    fetch(request: WebFetchRequest, signal?: AbortSignal): Promise<WebFetchResult>;
    /** One bounded request: merged signal + timeout, non-2xx as result, capped decode. */
    private fetchOnce;
}
