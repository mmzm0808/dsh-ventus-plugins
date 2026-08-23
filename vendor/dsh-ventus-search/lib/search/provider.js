/**
 * The Ventus multi-engine search provider (id 'ventus-search'). Runs the
 * enabled engines concurrently with a bounded pool, honors the external
 * AbortSignal and an overall deadline, retries transient failures, degrades
 * gracefully, and caches results per normalized query.
 * @module dsh-ventus-search/search/provider
 */
import { WebError } from '@deepseek-ai/dsh-web';
import { ENGINE_ADAPTERS, RetryableError } from './engines.js';
import { distinctUrlCount, rankAndDedupe } from './scoring.js';
/** Stable search provider id registered into ctx.web. */
export const VENTUS_SEARCH_PROVIDER_ID = 'ventus-search';
/** Fallback query passes when the first pass yields too few distinct results. */
const FALLBACK_QUERY_COUNT = 2;
/** A result is "too few" when it has fewer distinct URLs than this floor. */
function tooFewFloor(maxResults) {
    return Math.min(3, maxResults);
}
/** LRU query cache with TTL (Map keeps insertion order; re-insert on hit). */
class QueryCache {
    capacity;
    ttlMs;
    entries = new Map();
    constructor(capacity, ttlMs) {
        this.capacity = capacity;
        this.ttlMs = ttlMs;
    }
    get(key) {
        const entry = this.entries.get(key);
        if (entry === undefined)
            return undefined;
        if (Date.now() - entry.at > this.ttlMs) {
            this.entries.delete(key);
            return undefined;
        }
        this.entries.delete(key);
        this.entries.set(key, entry);
        return entry.result;
    }
    set(key, result) {
        if (this.entries.size >= this.capacity && !this.entries.has(key)) {
            const oldest = this.entries.keys().next().value;
            if (oldest !== undefined)
                this.entries.delete(oldest);
        }
        this.entries.set(key, { at: Date.now(), result });
    }
}
/** Run async workers over a bounded pool (concurrency-limited, order-preserving). */
async function runPool(items, worker, concurrency) {
    let next = 0;
    const runners = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
        while (next < items.length) {
            const index = next;
            next++;
            await worker(items[index]);
        }
    });
    await Promise.all(runners);
}
/** Cap an error message at max characters for the persisted state. */
function truncateMessage(message, max = 200) {
    return message.length > max ? message.slice(0, max) + '…' : message;
}
/** Strip quotes and filler words to produce retryable fallback queries. */
function fallbackQueries(query) {
    const variants = [];
    const noQuotes = query.replace(/[""'']/g, '');
    if (noQuotes !== query && noQuotes.trim().length > 0)
        variants.push(noQuotes.trim());
    const cnReduced = query
        .replace(/(什么是|如何|怎么|怎样|为什么|怎么样|的|了|吗|呢|和|与|及|在|是|请|帮我)/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    if (cnReduced.length > 0 && cnReduced !== query && !variants.includes(cnReduced))
        variants.push(cnReduced);
    const enReduced = query
        .replace(/\b(?:how|what|why|where|when|which|the|a|an|of|to|in|for|on|with)\b/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    if (enReduced.length > 0 && enReduced !== query && !variants.includes(enReduced))
        variants.push(enReduced);
    return variants.slice(0, FALLBACK_QUERY_COUNT);
}
/** The Ventus search provider. */
export class VentusSearchProvider {
    options;
    state;
    id = VENTUS_SEARCH_PROVIDER_ID;
    cache = new QueryCache(100, 300_000);
    constructor(options, state) {
        this.options = options;
        this.state = state;
    }
    /** Cheap local usability check: the persisted master switch. */
    available() {
        return this.state.get().enabled;
    }
    async search(request, signal) {
        if (!this.state.get().enabled) {
            throw new WebError('ventus-search disabled', 'WEB_PROVIDER_UNAVAILABLE');
        }
        if (signal?.aborted)
            throw new WebError('web search aborted', 'WEB_ABORTED');
        const query = request.query.trim().replace(/\s+/g, ' ');
        if (query.length === 0)
            return { sources: [], truncated: false };
        if (this.options.cacheEnabled) {
            const hit = this.cache.get(query);
            if (hit !== undefined)
                return hit;
        }
        const result = await this.runSearch(query, signal);
        if (this.options.cacheEnabled)
            this.cache.set(query, result);
        return result;
    }
    /** Execute all engine passes under one overall deadline and assemble results. */
    async runSearch(query, externalSignal) {
        const enabled = [];
        // Config is the hard default; the persisted state file overrides it at runtime.
        const engines = this.options.engines;
        const engineStates = this.state.get().engines;
        if (engines.bing && engineStates.bing.enabled) {
            enabled.push({ id: 'bing', run: (q, s) => ENGINE_ADAPTERS.bing(q, this.engineOptions(q, s)) });
        }
        if (engines.so360 && engineStates.so360.enabled) {
            enabled.push({ id: 'so360', run: (q, s) => ENGINE_ADAPTERS.so360(q, this.engineOptions(q, s)) });
        }
        if (engines.bilibili && engineStates.bilibili.enabled) {
            enabled.push({ id: 'bilibili', run: (q, s) => ENGINE_ADAPTERS.bilibili(q, this.engineOptions(q, s)) });
        }
        const deadline = new AbortController();
        let externalAborted = false;
        const onExternalAbort = () => {
            externalAborted = true;
            deadline.abort();
        };
        externalSignal?.addEventListener('abort', onExternalAbort, { once: true });
        const deadlineTimer = setTimeout(() => {
            deadline.abort();
        }, this.options.overallTimeoutMs);
        try {
            const collected = [];
            await this.collectPasses(enabled, query, deadline.signal, collected);
            if (externalAborted)
                throw new WebError('web search aborted', 'WEB_ABORTED');
            const ranked = rankAndDedupe(collected, query, this.options.maxDomainResults);
            const sources = ranked.slice(0, this.options.maxResults).map(entry => ({
                url: entry.url,
                title: entry.title,
                snippet: entry.snippet,
                publishedAt: entry.publishedAt,
            }));
            if (sources.length === 0) {
                if (!this.options.gracefulDegradation) {
                    throw new WebError('all ventus search engines failed', 'WEB_PROVIDER_ERROR');
                }
                return {
                    sources: [],
                    truncated: false,
                    content: 'Ventus 搜索：所有引擎均未返回结果（网络受限或全部失败）。',
                };
            }
            return { sources, truncated: false };
        }
        finally {
            clearTimeout(deadlineTimer);
            externalSignal?.removeEventListener('abort', onExternalAbort);
        }
    }
    engineOptions(query, signal) {
        return {
            maxResults: this.options.maxResults,
            signal,
            timeoutMs: this.options.requestTimeoutMs,
            ...(this.options.engines.bilibiliCookie ? { bilibiliCookie: this.options.engines.bilibiliCookie } : {}),
        };
    }
    /** One pass over the enabled engines, then fallback passes if results are too few. */
    async collectPasses(enabled, query, deadline, collected) {
        await this.runPass(enabled, query, deadline, collected);
        const floor = tooFewFloor(this.options.maxResults);
        if (distinctUrlCount(collected) >= floor || deadline.aborted)
            return;
        for (const variant of fallbackQueries(query)) {
            if (deadline.aborted)
                break;
            await this.runPass(enabled, variant, deadline, collected);
        }
    }
    /** One engine pass: bounded pool, per-engine retries, health write-back. */
    async runPass(enabled, query, deadline, collected) {
        await runPool(enabled, async (engine) => {
            let ok = false;
            let lastError;
            for (let attempt = 0; attempt <= this.options.retryCount; attempt++) {
                if (deadline.aborted)
                    break;
                try {
                    const sources = await engine.run(query, deadline);
                    ok = true;
                    collected.push(...sources);
                    this.state.setEngineHealth(engine.id, 'ok');
                    break;
                }
                catch (error) {
                    if (deadline.aborted)
                        break;
                    lastError = truncateMessage(error instanceof Error ? error.message : String(error), 200);
                    const retryable = error instanceof RetryableError;
                    if (!retryable)
                        break;
                    if (attempt >= this.options.retryCount)
                        break;
                    await new Promise(resolve => setTimeout(resolve, 250 * (attempt + 1)));
                }
            }
            if (!ok && !deadline.aborted)
                this.state.setEngineHealth(engine.id, 'fail', lastError);
        }, Math.max(1, this.options.maxConcurrency));
    }
}
//# sourceMappingURL=provider.js.map