/**
 * Result-quality scoring, redirect-wrapper decoding, URL normalization, and
 * dedupe for Ventus Search. Pure functions shared by every engine pass.
 * @module dsh-ventus-search/search/scoring
 */
/** Query/subscription/tracking parameters stripped during URL normalization. */
const TRACKING_PARAMS = new Set([
    'spm',
    'from',
    'search',
    'ref',
    'refer',
    'referrer',
    'source',
    'campaign',
    'clk',
    'hmsr',
    'hm_pl',
    'hm_kw',
    'bd_vid',
    'tn',
    'ie',
    'oq',
    'fr',
    'rsv_bp',
    'rsv_idx',
    'rsv_sug1',
    'rsv_sug2',
    'rsv_sug3',
    'rsv_sug4',
    'rsv_sug5',
    'rsv_sug7',
    'rsv_sug9',
    'rsv_sug10',
    'rsv_sug11',
    'rsv_sug12',
    'rsv_sug13',
    'rsv_sug14',
    'rsv_sug15',
    'rsv_sug16',
    'rsv_sug17',
    'rsv_sug18',
    'rsv_sug19',
    'rsv_sug20',
    'wd',
    'word',
    'qid',
    'oq',
]);
/** Decode a base64url (or base64) string; returns undefined on malformed input. */
function decodeBase64(value) {
    try {
        const cleaned = value.replace(/-/g, '+').replace(/_/g, '/');
        const padded = cleaned.padEnd(Math.ceil(cleaned.length / 4) * 4, '=');
        const decoded = Buffer.from(padded, 'base64').toString('utf8');
        return decoded.length > 0 ? decoded : undefined;
    }
    catch {
        return undefined;
    }
}
/**
 * Decode a search-engine redirect-wrapper URL (Bing /ck/a?a...&u=..., 360 /link
 * with a url param, and the a1%3a%2f%2f base64url form) into the real URL.
 * Returns undefined when the input is not a decodable wrapper.
 */
export function decodeRedirectUrl(raw) {
    try {
        const decodedOnce = decodeURIComponent(raw);
        if (decodedOnce.includes('a1://')) {
            const rest = decodedOnce.slice(decodedOnce.indexOf('a1://') + 5);
            const candidate = decodeBase64(rest);
            if (candidate && /^https?:\/\//i.test(candidate))
                return candidate;
        }
        const url = new URL(decodedOnce);
        const wrapped = url.searchParams.get('u') ?? url.searchParams.get('url');
        if (wrapped) {
            let candidate;
            if (wrapped.startsWith('a1')) {
                candidate = decodeBase64(wrapped.slice(2));
                if (!candidate)
                    candidate = decodeBase64(wrapped);
            }
            else if (wrapped.includes('://')) {
                candidate = wrapped;
            }
            else {
                candidate = decodeBase64(wrapped);
            }
            if (candidate && /^https?:\/\//i.test(candidate))
                return candidate;
        }
    }
    catch {
        // Not a wrapper URL; leave it untouched.
    }
    return undefined;
}
/**
 * Normalize a URL for dedupe: decode redirect wrappers, lowercase the host,
 * drop default ports, strip tracking parameters and the fragment, and trim a
 * bare root path. Returns undefined for unusable (non-http(s)) URLs.
 */
export function normalizeUrl(raw) {
    const real = decodeRedirectUrl(raw) ?? raw;
    let url;
    try {
        url = new URL(real);
    }
    catch {
        return undefined;
    }
    if (url.protocol !== 'http:' && url.protocol !== 'https:')
        return undefined;
    url.hostname = url.hostname.toLowerCase();
    if ((url.protocol === 'http:' && url.port === '80') || (url.protocol === 'https:' && url.port === '443')) {
        url.port = '';
    }
    for (const key of [...url.searchParams.keys()]) {
        const lower = key.toLowerCase();
        if (lower.startsWith('utm_') || TRACKING_PARAMS.has(lower))
            url.searchParams.delete(key);
    }
    url.hash = '';
    if (url.pathname === '/' && url.search === '')
        url.pathname = '';
    return url.toString();
}
const TOKEN_RE = /[\p{L}\p{N}]+/gu;
/** Extract relevance tokens: latin/number words plus individual CJK characters. */
function tokensOf(query) {
    const lower = query.toLowerCase();
    const tokens = [];
    for (const match of lower.matchAll(TOKEN_RE))
        tokens.push(match[0]);
    for (const char of lower) {
        if (/[\u4e00-\u9fff]/.test(char) && !tokens.includes(char))
            tokens.push(char);
    }
    return tokens;
}
/** Count how many query tokens appear in a text. */
function hits(text, tokens) {
    const lower = text.toLowerCase();
    let count = 0;
    for (const token of tokens)
        if (lower.includes(token))
            count++;
    return count;
}
/**
 * Score every source (title hit *3 + snippet hit *2 - rank position), dedupe by
 * normalized URL keeping the best-scored entry, cap results per hostname, and
 * sort by score desc then rank asc. Display URLs are the decoded real URLs.
 */
export function rankAndDedupe(sources, query, maxDomainResults) {
    const tokens = tokensOf(query);
    const best = new Map();
    for (const source of sources) {
        const key = normalizeUrl(source.url);
        if (key === undefined)
            continue;
        const realUrl = decodeRedirectUrl(source.url) ?? source.url;
        const score = hits(source.title, tokens) * 3 + hits(source.snippet ?? '', tokens) * 2 - source.rank * 1.5;
        const entry = { ...source, url: realUrl, score };
        const existing = best.get(key);
        if (existing === undefined || entry.score > existing.score)
            best.set(key, entry);
    }
    const sorted = [...best.values()].sort((a, b) => b.score - a.score || a.rank - b.rank);
    const perDomain = new Map();
    const out = [];
    for (const entry of sorted) {
        let host;
        try {
            host = new URL(entry.url).hostname.toLowerCase();
        }
        catch {
            continue;
        }
        const count = perDomain.get(host) ?? 0;
        if (count >= maxDomainResults)
            continue;
        perDomain.set(host, count + 1);
        out.push(entry);
    }
    return out;
}
/** Count distinct normalized URLs (used to decide whether a fallback pass is needed). */
export function distinctUrlCount(sources) {
    const seen = new Set();
    for (const source of sources) {
        const key = normalizeUrl(source.url);
        if (key !== undefined)
            seen.add(key);
    }
    return seen.size;
}
//# sourceMappingURL=scoring.js.map