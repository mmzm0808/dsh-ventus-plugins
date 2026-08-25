/**
 * dsh-ventus-research — 科研工作流插件 host 入口。
 *
 * 独立 bundle 行挂载（cordis.patch.yml 的 ventus-research 行），不依赖整合包
 * 其它子插件：失败/禁用只影响本 fiber。注册 7 个工具 + /research-bench/sign
 * 一次性签字令牌路由（设计稿 4.4）。
 */
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Context } from '@deepseek-ai/cordis'
import type { WebServer } from '@deepseek-ai/dsh-host-webserver'
import z from 'schemastery'
import { findClaim, readState } from './state.js'
import { signatureTokens } from './token.js'
import { getCurrentBenchRoot, registerBenchTools } from './tools.js'

/** 稳定 cordis 插件名（匹配 cordis.patch.yml insert id）。 */
export const name = 'dsh-ventus-research'

/** 必需服务：工具注册（webServer 可选，见 apply——headless 无 HTTP 时跳过 sign 路由）。 */
export const inject = ['tools']

/** 插件配置。 */
export interface Config {
  /** tol class 误差档位覆盖（key=档位名，value={pass,warn}）。 */
  tolClasses: Record<string, { pass: number; warn: number }>
}

export const Config: z<Config> = z.object({
  tolClasses: z.dict(z.object({
    pass: z.number().min(0),
    warn: z.number().min(0),
  })).default({}),
})

type AppContext = Context & {
  webServer: WebServer
}

/** 读 POST body（node 原生 req）。 */
async function readJsonBody(req: IncomingMessage, limit = 16 * 1024): Promise<unknown> {
  const chunks: Buffer[] = []
  let total = 0
  for await (const chunk of req) {
    const buf = Buffer.from(chunk as Uint8Array)
    total += buf.byteLength
    if (total > limit) throw new Error('body too large')
    chunks.push(buf)
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'))
}

/** POST /research-bench/sign — 签发一次性人工裁决令牌（设计稿 4.4）。 */
async function signHandler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
  const fail = (error: string): void => {
    res.end(JSON.stringify({ ok: false, error }))
  }
  if (req.method !== 'POST') {
    fail('method must be POST')
    return
  }
  let body: unknown
  try {
    body = await readJsonBody(req)
  } catch {
    fail('invalid JSON body')
    return
  }
  if (typeof body !== 'object' || body === null) {
    fail('body must be a JSON object')
    return
  }
  const record = body as Record<string, unknown>
  const claimId = record.claim_id
  const revision = record.revision
  if (typeof claimId !== 'string' || typeof revision !== 'number') {
    fail('body requires { claim_id: string, revision: number }')
    return
  }
  // 校验 claim 存在且版本匹配（需先 rb_open）。
  const root = getCurrentBenchRoot()
  const state = root !== null ? readState(root) : null
  const claim = state !== null ? findClaim(state, claimId) : undefined
  if (claim === undefined) {
    fail(`claim ${claimId} 不存在（请先 rb_open）`)
    return
  }
  if (claim.version !== revision) {
    fail(`claim ${claimId} 版本不匹配：期望 ${claim.version}，得到 ${revision}`)
    return
  }
  const issued = signatureTokens.issue(claimId, revision)
  res.end(JSON.stringify({ ok: true, token: issued.token, expires: issued.expires, claim_id: claimId, revision }))
}

export function apply(ctx: AppContext, config: Config): void {
  // 7 个工具：资源挂 ctx.effect，卸载/HMR 自动清理。
  ctx.effect(() => {
    const disposers = registerBenchTools(ctx, { tolClasses: config.tolClasses })
    return () => { for (const dispose of disposers) dispose() }
  }, 'dsh-ventus-research: tools')

  // 人工裁决签字令牌端点。webServer 为可选服务：无 webServer 的 profile
  // （如 headless）跳过 sign 路由，工具照常可用——不拖垮宿主组合。
  if (ctx.get('webServer') !== undefined) {
    ctx.effect(() => ctx.webServer.register({
      kind: 'exact',
      path: '/research-bench/sign',
      handler: signHandler,
    }), 'dsh-ventus-research: sign route')
  }
}
