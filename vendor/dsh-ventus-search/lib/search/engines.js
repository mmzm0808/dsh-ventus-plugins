/**
 * Search engine adapters: Bing (HTML), 360 so.com (HTML, two entry variants),
 * and the Bilibili search JSON API. Each adapter honors an external AbortSignal
 * plus its own per-attempt timeout, and returns plain RawSource items; redirect
 * wrappers are decoded later by scoring.ts.
 * @module dsh-ventus-search/search/engines
 */
/** Error the provider may retry (429 / 5xx / request timeout). */
export class RetryableError extends Error {
}
const DESKTOP_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
/** Abort-aware delay; rejects immediately when the signal aborts. */
function abortableDelay(ms, signal) {
    return new Promise((resolve, reject) => {
        if (signal.aborted) {
            reject(new Error('request aborted'));
            return;
        }
        const timer = setTimeout(() => {
            signal.removeEventListener('abort', onAbort);
            resolve();
        }, ms);
        const onAbort = () => {
            clearTimeout(timer);
            reject(new Error('request aborted'));
        };
        signal.addEventListener('abort', onAbort, { once: true });
    });
}
/**
 * One bounded HTTP GET. The caller's signal and an internal timeout are merged
 * through an inner AbortController; 429/5xx and own-timeout throws are
 * RetryableError, every other non-2xx is a plain Error.
 */
async function fetchText(url, opts) {
    if (opts.signal.aborted)
        throw new Error('request aborted');
    const controller = new AbortController();
    const onAbort = () => {
        controller.abort(opts.signal.reason);
    };
    opts.signal.addEventListener('abort', onAbort, { once: true });
    const timer = setTimeout(() => {
        controller.abort(new RetryableError('request timed out'));
    }, opts.timeoutMs);
    try {
        const response = await fetch(url, {
            headers: {
                'user-agent': DESKTOP_UA,
                'accept': 'text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8',
                ...opts.headers,
            },
            signal: controller.signal,
            redirect: 'follow',
        });
        if (response.status === 429 || response.status >= 500) {
            throw new RetryableError('HTTP ' + response.status + ' for ' + url);
        }
        if (!response.ok)
            throw new Error('HTTP ' + response.status + ' for ' + url);
        return await response.text();
    }
    finally {
        clearTimeout(timer);
        opts.signal.removeEventListener('abort', onAbort);
    }
}
/** Strip all HTML tags from a fragment. */
function stripTags(input) {
    return input.replace(/<[^>]*>/g, '');
}
/** Decode common HTML entities (named + decimal/hex numeric). */
function decodeEntities(input) {
    return input
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
        .replace(/&apos;/gi, "'")
        .replace(/&#x([0-9a-f]+);/gi, (_m, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
        .replace(/&#(\d+);/g, (_m, dec) => String.fromCodePoint(Number.parseInt(dec, 10)));
}
/** Clean a text fragment: strip tags, decode entities, collapse whitespace. */
function cleanText(input) {
    return decodeEntities(stripTags(input)).replace(/\s+/g, ' ').trim();
}
/** Pick a Bing market from the query: zh-CN for CJK queries, en-US otherwise. */
function pickBingMarket(query) {
    return /[\u4e00-\u9fff]/.test(query) ? 'zh-CN' : 'en-US';
}
/** Parse Bing result blocks (<li class="b_algo">). */
function parseBingHtml(html, maxResults) {
    const out = [];
    const block = /<li class="b_algo"[\s\S]*?<\/li>/gi;
    let match;
    let rank = 0;
    while ((match = block.exec(html)) !== null && out.length < maxResults) {
        const li = match[0];
        const anchor = /<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i.exec(li);
        if (!anchor || !anchor[1])
            continue;
        const url = decodeEntities(anchor[1]).trim();
        const title = cleanText(anchor[2]);
        if (!title || !/^https?:\/\//i.test(url))
            continue;
        const paragraph = /<p[^>]*>([\s\S]*?)<\/p>/i.exec(li);
        const snippet = paragraph && paragraph[1] ? cleanText(paragraph[1]) : undefined;
        out.push({ url, title, snippet: snippet || undefined, rank: rank++ });
    }
    return out;
}
/** Bing web (or news) search. */
export async function bingSearch(query, opts) {
    let target = query.trim();
    let news = false;
    if (/^news:/i.test(target)) {
        news = true;
        target = target.slice(5).trim();
    }
    const params = new URLSearchParams({ q: target, setmkt: pickBingMarket(target) });
    if (opts.maxResults > 0)
        params.set('count', String(Math.min(opts.maxResults, 20)));
    const base = news ? 'https://www.bing.com/news/search' : 'https://www.bing.com/search';
    const html = await fetchText(base + '?' + params.toString(), {
        signal: opts.signal,
        timeoutMs: opts.timeoutMs,
    });
    return parseBingHtml(html, opts.maxResults);
}
/** Parse 360 result blocks (<li class="res-...">) with res-desc snippets. */
function parseSo360Html(html, maxResults) {
    const out = [];
    const block = /<li class="res-[^"]*"[\s\S]*?<\/li>/gi;
    let match;
    let rank = 0;
    while ((match = block.exec(html)) !== null && out.length < maxResults) {
        const li = match[0];
        const anchor = /<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i.exec(li);
        if (!anchor || !anchor[1])
            continue;
        const url = decodeEntities(anchor[1]).trim();
        const title = cleanText(anchor[2]);
        if (!title || !/^https?:\/\//i.test(url))
            continue;
        const desc = /<(?:p|div)[^>]*class="[^"]*res-desc[^"]*"[^>]*>([\s\S]*?)<\/(?:p|div)>/i.exec(li);
        const snippet = desc && desc[1] ? cleanText(desc[1]) : undefined;
        out.push({ url, title, snippet: snippet || undefined, rank: rank++ });
    }
    return out;
}
/** 360 so.com search with two entry variants as redundancy. */
export async function so360Search(query, opts) {
    const encoded = encodeURIComponent(query.trim());
    const variants = [
        'https://www.so.com/s?q=' + encoded,
        'https://www.so.com/s?ie=utf-8&q=' + encoded,
    ];
    let lastError = new Error('so360 search failed');
    for (const variant of variants) {
        try {
            const html = await fetchText(variant, { signal: opts.signal, timeoutMs: opts.timeoutMs });
            const sources = parseSo360Html(html, opts.maxResults);
            if (sources.length > 0)
                return sources;
        }
        catch (error) {
            lastError = error;
        }
    }
    if (lastError instanceof Error)
        throw lastError;
    throw new Error('so360 search failed');
}
/** Bilibili video search through the public search/all/v2 JSON API. */
export async function bilibiliSearch(query, opts) {
    const url = 'https://api.bilibili.com/x/web-interface/search/all/v2?keyword=' + encodeURIComponent(query.trim());
    const cookie = opts.bilibiliCookie && opts.bilibiliCookie.length > 0
        ? opts.bilibiliCookie
        : 'buvid3=ventus-search-default-2026';
    const text = await fetchText(url, {
        signal: opts.signal,
        timeoutMs: opts.timeoutMs,
        headers: {
            cookie,
            referer: 'https://www.bilibili.com/',
            'accept': 'application/json,text/plain,*/*',
        },
    });
    const parsed = JSON.parse(text);
    if (parsed.code !== 0)
        throw new Error('bilibili API error code ' + String(parsed.code));
    const groups = parsed.data?.result ?? [];
    const videoGroup = groups.find(group => group.result_type === 'video');
    const items = videoGroup?.data ?? [];
    const out = [];
    let rank = 0;
    for (const item of items) {
        if (out.length >= opts.maxResults)
            break;
        if (!item.arcurl || !item.title)
            continue;
        let snippet = item.description ? cleanText(item.description) : undefined;
        if (!snippet && item.author)
            snippet = item.author;
        out.push({
            url: item.arcurl,
            title: cleanText(item.title),
            snippet: snippet || undefined,
            publishedAt: typeof item.pubdate === 'number' && item.pubdate > 0
                ? new Date(item.pubdate * 1000).toISOString()
                : undefined,
            rank: rank++,
        });
    }
    return out;
}
/** The engine adapter table keyed by stable engine id. */
export const ENGINE_ADAPTERS = {
    bing: bingSearch,
    so360: so360Search,
    bilibili: bilibiliSearch,
};
//# sourceMappingURL=engines.js.map