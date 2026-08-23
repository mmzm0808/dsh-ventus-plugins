/**
 * The Ventus fetch provider (id 'ventus-fetch'): URL validation, ad/tracking
 * domain blocklist, UA + signal + timeout, mirror-domain fallback, charset-aware
 * decoding, and Readability-style extraction for HTML responses.
 * @module dsh-ventus-search/fetch/provider
 */
import { WebError } from '@deepseek-ai/dsh-web';
import { extractReadable } from './extract.js';
/** Stable fetch provider id registered into ctx.web (avoids the official 'http' id). */
export const VENTUS_FETCH_PROVIDER_ID = 'ventus-fetch';
const DESKTOP_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
/** Hard body-size guard while streaming (bytes); decoded chars are capped later. */
const MAX_RESPONSE_BYTES = 2_000_000;
/** Decoded body cap in characters. */
const MAX_BODY_CHARS = 200_000;
/** Validate and parse an http(s) URL, or throw WEB_INVALID_URL. */
function validateUrl(raw) {
    let url;
    try {
        url = new URL(raw);
    }
    catch (error) {
        throw new WebError('invalid URL "' + raw + '"', 'WEB_INVALID_URL', { cause: error });
    }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        throw new WebError('invalid URL protocol "' + url.protocol + '"', 'WEB_INVALID_URL');
    }
    return url;
}
/** Exact host or any subdomain matches a blocked domain entry. */
function isBlocked(host, blockedDomains) {
    const lower = host.toLowerCase();
    return blockedDomains.some(domain => {
        const d = domain.trim().toLowerCase().replace(/^\./, '');
        return d.length > 0 && (lower === d || lower.endsWith('.' + d));
    });
}
/** Replace the host of a URL with a mirror host (protocol/scheme preserved). */
function mirrorUrl(original, mirrorHost) {
    const copy = new URL(original.toString());
    copy.hostname = mirrorHost;
    copy.port = '';
    return copy.toString();
}
/** Parse the charset label from a content-type header (defaults to utf-8). */
function parseCharset(contentType) {
    const match = contentType?.match(/charset\s*=\s*["']?([^;"'\s]+)/i);
    return match?.[1] ?? 'utf-8';
}
/** The Ventus fetch provider. */
export class VentusFetchProvider {
    options;
    masterEnabled;
    id = VENTUS_FETCH_PROVIDER_ID;
    constructor(options, masterEnabled) {
        this.options = options;
        this.masterEnabled = masterEnabled;
    }
    /** Cheap local usability check: fetch enabled in config and the master switch on. */
    available() {
        return this.options.enabled && this.masterEnabled();
    }
    async fetch(request, signal) {
        if (!this.available())
            throw new WebError('ventus fetch disabled', 'WEB_PROVIDER_UNAVAILABLE');
        if (signal?.aborted)
            throw new WebError('web fetch aborted', 'WEB_ABORTED');
        const initial = validateUrl(request.url);
        const host = initial.hostname.toLowerCase();
        if (isBlocked(host, this.options.blockedDomains)) {
            throw new WebError('blocked domain "' + host + '"', 'WEB_FETCH_BLOCKED');
        }
        const mirrors = this.options.mirrorDomains[host] ?? [];
        const candidates = [initial.toString(), ...mirrors.map(mirror => mirrorUrl(initial, mirror))];
        let lastError;
        for (const target of candidates) {
            try {
                return await this.fetchOnce(target, signal);
            }
            catch (error) {
                lastError = error;
                if (signal?.aborted)
                    throw new WebError('web fetch aborted', 'WEB_ABORTED', { cause: error });
                // Keep trying mirrors; the last error wins if all fail.
            }
        }
        if (lastError instanceof WebError)
            throw lastError;
        throw new WebError('ventus fetch failed: ' + String(lastError), 'WEB_PROVIDER_ERROR', { cause: lastError });
    }
    /** One bounded request: merged signal + timeout, non-2xx as result, capped decode. */
    async fetchOnce(target, signal) {
        const controller = new AbortController();
        const onAbort = () => {
            controller.abort(signal?.reason);
        };
        signal?.addEventListener('abort', onAbort, { once: true });
        let timedOut = false;
        const timer = setTimeout(() => {
            timedOut = true;
            controller.abort(new Error('ventus fetch timed out'));
        }, this.options.timeoutMs);
        try {
            const response = await fetch(target, {
                headers: {
                    'user-agent': DESKTOP_UA,
                    'accept': 'text/html,application/xhtml+xml,text/*;q=0.9,application/json;q=0.8',
                },
                signal: controller.signal,
                redirect: 'follow',
            });
            const finalUrl = response.url.length > 0 ? response.url : target;
            if (!response.ok) {
                await response.body?.cancel().catch(() => undefined);
                return { url: finalUrl, statusCode: response.status, body: { kind: 'text', content: '' }, truncated: false };
            }
            const contentType = response.headers.get('content-type');
            // Body read stays under the same abort window as the request.
            const { bytes, truncatedByBytes } = await readCapped(response, signal, controller.signal);
            const decoder = new TextDecoder(safeCharset(parseCharset(contentType)));
            const decoded = decoder.decode(bytes);
            const truncatedByChars = decoded.length > MAX_BODY_CHARS;
            const capped = truncatedByChars ? decoded.slice(0, MAX_BODY_CHARS) : decoded;
            const isHtml = (contentType ?? '').toLowerCase().includes('html');
            const body = isHtml ? extractReadable(capped, finalUrl) : { kind: 'text', content: capped };
            return {
                url: finalUrl,
                statusCode: response.status,
                body,
                truncated: truncatedByBytes || truncatedByChars,
            };
        }
        catch (error) {
            if (error instanceof WebError)
                throw error;
            if (signal?.aborted)
                throw new WebError('web fetch aborted', 'WEB_ABORTED', { cause: error });
            if (timedOut)
                throw new WebError('ventus fetch timed out', 'WEB_FETCH_TIMEOUT', { cause: error });
            throw new WebError('ventus fetch network failure: ' + String(error), 'WEB_PROVIDER_ERROR', { cause: error });
        }
        finally {
            clearTimeout(timer);
            signal?.removeEventListener('abort', onAbort);
        }
    }
}
/** A charset TextDecoder accepts; unknown labels fall back to utf-8. */
function safeCharset(charset) {
    try {
        new TextDecoder(charset);
        return charset;
    }
    catch {
        return 'utf-8';
    }
}
/** Stream the body up to MAX_RESPONSE_BYTES, honoring the merged signal. */
async function readCapped(response, signal, controllerSignal) {
    const declared = response.headers.get('content-length');
    if (declared !== null && Number(declared) > MAX_RESPONSE_BYTES) {
        await response.body?.cancel().catch(() => undefined);
        throw new WebError('response exceeds the maximum of ' + MAX_RESPONSE_BYTES + ' bytes', 'WEB_FETCH_TOO_LARGE');
    }
    if (response.body === null)
        return { bytes: new Uint8Array(0), truncatedByBytes: false };
    const reader = response.body.getReader();
    const chunks = [];
    let total = 0;
    let truncatedByBytes = false;
    try {
        for (;;) {
            const { done, value } = await reader.read();
            if (done)
                break;
            const remaining = MAX_RESPONSE_BYTES - total;
            if (value.byteLength > remaining) {
                chunks.push(value.subarray(0, remaining));
                total += remaining;
                truncatedByBytes = true;
                break;
            }
            chunks.push(value);
            total += value.byteLength;
        }
    }
    catch (error) {
        if (signal?.aborted)
            throw new WebError('web fetch aborted', 'WEB_ABORTED', { cause: error });
        if (controllerSignal.aborted && !signal?.aborted) {
            throw new WebError('ventus fetch timed out', 'WEB_FETCH_TIMEOUT', { cause: error });
        }
        throw new WebError('ventus fetch read failure: ' + String(error), 'WEB_PROVIDER_ERROR', { cause: error });
    }
    finally {
        await reader.cancel().catch(() => undefined);
    }
    const bytes = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
        bytes.set(chunk, offset);
        offset += chunk.byteLength;
    }
    return { bytes, truncatedByBytes };
}
//# sourceMappingURL=provider.js.map