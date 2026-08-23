/**
 * dsh-ventus-search — host half. Registers a multi-engine search provider and a
 * fetch provider into ctx.web, plus loopback-only state routes backing the
 * settings card (master switch + per-engine health). All routes/providers are
 * effect-owned and clean up with the fiber.
 * @module dsh-ventus-search
 */
import { homedir } from 'node:os';
import { join } from 'node:path';
import z from 'schemastery';
import { StateStore } from './state.js';
import { VentusSearchProvider } from './search/provider.js';
import { VentusFetchProvider } from './fetch/provider.js';
/** Stable cordis plugin name (matches cordis.patch.yml insert id). */
export const name = 'ventus-search';
/** Services required before the providers and routes can mount. */
export const inject = ['web', 'webServer'];
/** Default ad/tracking domains refused by the fetch provider. */
const DEFAULT_BLOCKED_DOMAINS = ['doubleclick.net', 'googleadservices.com', 'googlesyndication.com'];
export const Config = z.object({
    enabled: z.boolean().default(true),
    stateFilePath: z.string().default('~/.dsh/plugins/ventus-search/state.json'),
    engines: z.object({
        bing: z.boolean().default(true),
        so360: z.boolean().default(true),
        bilibili: z.boolean().default(true),
        bilibiliCookie: z.string().default(''),
    }).default({ bing: true, so360: true, bilibili: true, bilibiliCookie: '' }),
    maxResults: z.number().min(1).max(50).default(8),
    maxDomainResults: z.number().min(1).max(20).default(2),
    requestTimeoutMs: z.number().min(100).default(8000),
    overallTimeoutMs: z.number().min(1000).default(15000),
    maxConcurrency: z.number().min(1).max(16).default(4),
    retryCount: z.number().min(0).max(5).default(1),
    gracefulDegradation: z.boolean().default(true),
    cache: z.object({ enabled: z.boolean().default(true) }).default({ enabled: true }),
    fetch: z.object({
        enabled: z.boolean().default(true),
        blockedDomains: z.array(z.string()).default([...DEFAULT_BLOCKED_DOMAINS]),
        mirrorDomains: z.dict(z.array(z.string())).default({}),
    }).default({
        enabled: true,
        blockedDomains: [...DEFAULT_BLOCKED_DOMAINS],
        mirrorDomains: {},
    }),
});
/** Expand a leading ~ in a configured path to the user's home directory. */
function expandHome(filePath) {
    if (filePath === '~')
        return homedir();
    if (filePath.startsWith('~/') || filePath.startsWith('~\\')) {
        return join(homedir(), filePath.slice(2));
    }
    return filePath;
}
/** Loopback-only guard plus same-origin browser marker check. */
function isLoopbackRequest(request) {
    const address = request.socket.remoteAddress;
    if (address !== '127.0.0.1' && address !== '::1' && address !== '::ffff:127.0.0.1')
        return false;
    const host = request.headers.host;
    if (typeof host !== 'string')
        return false;
    let hostUrl;
    try {
        hostUrl = new URL('http://' + host);
    }
    catch {
        return false;
    }
    if (hostUrl.hostname !== '127.0.0.1' && hostUrl.hostname !== 'localhost' && hostUrl.hostname !== '[::1]')
        return false;
    if (request.headers['sec-fetch-site'] === 'cross-site')
        return false;
    const origin = request.headers.origin;
    if (origin === undefined)
        return true;
    try {
        return new URL(origin).host === hostUrl.host;
    }
    catch {
        return false;
    }
}
/** Write one JSON response with no-store semantics. */
function writeJson(res, status, body) {
    res.writeHead(status, {
        'content-type': 'application/json; charset=utf-8',
        'referrer-policy': 'no-referrer',
        'cache-control': 'no-store',
    });
    res.end(JSON.stringify(body));
}
/** Read and parse a bounded JSON request body. */
function readJsonBody(request) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        let size = 0;
        request.on('data', (chunk) => {
            size += chunk.length;
            if (size > 16 * 1024) {
                reject(new Error('request body too large'));
                request.destroy();
                return;
            }
            chunks.push(chunk);
        });
        request.on('end', () => {
            try {
                resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
            }
            catch (error) {
                reject(new Error('invalid JSON body: ' + String(error)));
            }
        });
        request.on('error', reject);
    });
}
/** Map plugin config to the search provider options. */
function searchOptions(config) {
    return {
        engines: { ...config.engines },
        maxResults: config.maxResults,
        maxDomainResults: config.maxDomainResults,
        requestTimeoutMs: config.requestTimeoutMs,
        overallTimeoutMs: config.overallTimeoutMs,
        maxConcurrency: config.maxConcurrency,
        retryCount: config.retryCount,
        gracefulDegradation: config.gracefulDegradation,
        cacheEnabled: config.cache.enabled,
    };
}
/** Map plugin config to the fetch provider options. */
function fetchOptions(config) {
    return {
        enabled: config.fetch.enabled,
        blockedDomains: [...config.fetch.blockedDomains],
        mirrorDomains: { ...config.fetch.mirrorDomains },
        timeoutMs: config.requestTimeoutMs,
    };
}
/** Register the plugin. */
export function apply(ctx, config) {
    const state = new StateStore(expandHome(config.stateFilePath));
    state.load(config.enabled);
    // Providers are created before the routes so the test route can call search().
    const searchProvider = new VentusSearchProvider(searchOptions(config), state);
    const fetchProvider = new VentusFetchProvider(fetchOptions(config), () => state.get().enabled);
    const stateRoute = {
        kind: 'exact',
        path: '/api/ventus-search/state',
        handler: async (req, res) => {
            if (!isLoopbackRequest(req)) {
                writeJson(res, 403, { error: 'forbidden: loopback-only' });
                return;
            }
            if (req.method === 'GET') {
                writeJson(res, 200, state.get());
                return;
            }
            if (req.method !== 'PATCH') {
                writeJson(res, 405, { error: 'method not allowed (expected GET or PATCH)' });
                return;
            }
            try {
                const body = await readJsonBody(req);
                if (typeof body !== 'object' || body === null) {
                    writeJson(res, 400, { error: 'body must be a JSON object' });
                    return;
                }
                const enabledPatch = typeof body.enabled === 'boolean' ? body.enabled : undefined;
                const enginesRaw = body.engines;
                const hasEnginePatch = typeof enginesRaw === 'object' && enginesRaw !== null
                    && Object.keys(enginesRaw).length > 0;
                const enginesValid = hasEnginePatch && Object.entries(enginesRaw).every(([id, value]) => (id === 'bing' || id === 'so360' || id === 'bilibili') && typeof value === 'boolean');
                if (enabledPatch === undefined && !hasEnginePatch) {
                    writeJson(res, 400, { error: 'body must include enabled and/or engines' });
                    return;
                }
                if (enginesRaw !== undefined && !enginesValid) {
                    writeJson(res, 400, { error: 'engines must be { bing?, so360?, bilibili? } with boolean values' });
                    return;
                }
                let next = state.get();
                if (enabledPatch !== undefined)
                    next = state.setEnabled(enabledPatch);
                if (hasEnginePatch) {
                    for (const [id, value] of Object.entries(enginesRaw)) {
                        next = state.setEngineEnabled(id, value);
                    }
                }
                writeJson(res, 200, next);
            }
            catch (error) {
                writeJson(res, 400, { error: error instanceof Error ? error.message : String(error) });
            }
        },
    };
    const testRoute = {
        kind: 'exact',
        path: '/api/ventus-search/test',
        handler: async (req, res) => {
            if (!isLoopbackRequest(req)) {
                writeJson(res, 403, { error: 'forbidden: loopback-only' });
                return;
            }
            if (req.method !== 'POST') {
                writeJson(res, 405, { error: 'method not allowed (expected POST)' });
                return;
            }
            let body;
            try {
                const parsed = await readJsonBody(req);
                if (typeof parsed !== 'object' || parsed === null) {
                    throw new Error('body must be a JSON object');
                }
                body = parsed;
            }
            catch (error) {
                writeJson(res, 400, { error: error instanceof Error ? error.message : String(error) });
                return;
            }
            const query = typeof body.query === 'string' ? body.query : undefined;
            if (query === undefined || query.trim().length === 0 || query.length > 200) {
                writeJson(res, 400, { error: 'query is required, non-empty, and at most 200 characters' });
                return;
            }
            const started = Date.now();
            try {
                const result = await searchProvider.search({ query, maxResults: 5 });
                writeJson(res, 200, {
                    ok: true,
                    durationMs: Date.now() - started,
                    sources: result.sources,
                    engines: state.get().engines,
                });
            }
            catch (error) {
                writeJson(res, 200, {
                    ok: false,
                    error: error instanceof Error ? error.message : String(error),
                    engines: state.get().engines,
                });
            }
        },
    };
    ctx.effect(() => {
        const disposeState = ctx.webServer.register(stateRoute);
        const disposeTest = ctx.webServer.register(testRoute);
        return () => {
            disposeState();
            disposeTest();
        };
    }, 'ventus-search: routes');
    ctx.effect(() => {
        const disposeSearch = ctx.web.registerSearchProvider(searchProvider);
        const disposeFetch = ctx.web.registerFetchProvider(fetchProvider);
        return () => {
            disposeSearch();
            disposeFetch();
        };
    }, 'ventus-search: providers');
}
//# sourceMappingURL=index.js.map