// dsh-ua-relay — UA-rewriting reverse relay for any provider.
// DSH adapters force the `deepseek-harness/…` attribution User-Agent on every
// provider request, and some gateways (B.AI, etc.) reject that UA. This plugin
// exposes a reverse-proxy route on the DSH web server that forwards each
// provider's traffic to its target base URL with a browser User-Agent — the
// same trick cc-switch uses. Point a provider's baseURL at
// `http://127.0.0.1:3080/api/ua-relay/<key>/v1` and its requests go out with
// the rewritten UA.
//
// Config: `{ targets: { <key>: 'https://base-url', ... }, userAgent? }`.
// The route `/api/ua-relay/<key>/<rest>` forwards to `targets[<key>] + /<rest>`.

import { request as httpsRequest } from 'node:https'

export const name = 'ua-relay'

export const inject = ['webServer']

/** Route prefix this relay owns on the DSH web server. */
export const RELAY_PREFIX = '/api/ua-relay'

/** Default browser User-Agent the relay sends to the gateway. */
const DEFAULT_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'

/** Register the relay route. */
export function apply(ctx, config = {}) {
  const targets = (config && typeof config.targets === 'object' && config.targets !== null)
    ? config.targets
    : {}
  const userAgent = (typeof config.userAgent === 'string' && config.userAgent.trim())
    || DEFAULT_USER_AGENT

  ctx.effect(() => ctx.webServer.register({
    kind: 'prefix',
    path: RELAY_PREFIX,
    handler: (req, res) => {
      const incoming = new URL(req.url ?? '/', 'http://localhost')
      const rest = incoming.pathname.startsWith(RELAY_PREFIX)
        ? incoming.pathname.slice(RELAY_PREFIX.length)
        : incoming.pathname
      const trimmed = rest.startsWith('/') ? rest.slice(1) : rest
      const slash = trimmed.indexOf('/')
      const provider = slash === -1 ? trimmed : trimmed.slice(0, slash)
      const pathRest = slash === -1 ? '/' : trimmed.slice(slash)
      const base = targets[provider]
      if (typeof base !== 'string' || base === '') {
        res.writeHead(404, { 'content-type': 'text/plain' })
        res.end(`[ua-relay] unknown provider key: ${provider}\n`)
        return
      }
      const upstream = new URL(base + pathRest + incoming.search)

      const auth = req.headers['authorization'] ?? ''
      const maskedAuth = auth.length > 12 ? auth.slice(0, 7) + '…' + auth.slice(-4) : auth

      const headers = { ...req.headers }
      delete headers.host
      delete headers.connection
      headers.host = upstream.host
      headers['user-agent'] = userAgent

      const forward = httpsRequest({
        hostname: upstream.hostname,
        port: upstream.port === '' ? 443 : Number(upstream.port),
        path: upstream.pathname + upstream.search,
        method: req.method,
        headers,
      }, (upstreamRes) => {
        console.log(`[ua-relay] ${req.method} ${incoming.pathname} -> ${upstream.host}${upstream.pathname} auth=${maskedAuth} => ${upstreamRes.statusCode}`)
        const responseHeaders = { ...upstreamRes.headers }
        delete responseHeaders.connection
        res.writeHead(upstreamRes.statusCode ?? 502, upstreamRes.statusMessage, responseHeaders)
        upstreamRes.pipe(res)
      })

      forward.on('error', (error) => {
        console.log(`[ua-relay] upstream error: ${error.message}`)
        if (res.headersSent) {
          res.destroy()
          return
        }
        res.writeHead(502, { 'content-type': 'text/plain' })
        res.end(`[ua-relay] upstream error: ${error.message}\n`)
      })

      req.pipe(forward)
    },
  }), 'dsh-ua-relay: route')
}