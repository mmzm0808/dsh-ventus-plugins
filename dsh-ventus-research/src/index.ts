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
import { findClaim, localIso, pushOpLog, readState, writeState } from './state.js'
import { transition } from './gates.js'
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

/** GET /research-bench/state — 读取当前课题状态快照（供科研工作台渲染）。 */
async function stateHandler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
  if (req.method !== 'GET') {
    res.end(JSON.stringify({ ok: false, error: 'method must be GET' }))
    return
  }
  const root = getCurrentBenchRoot()
  if (root === null) {
    res.end(JSON.stringify({ ok: false, error: '未打开课题（先用 rb_open 立项）' }))
    return
  }
  const state = readState(root)
  if (state === null) {
    res.end(JSON.stringify({ ok: false, error: '课题状态文件读取失败' }))
    return
  }
  const byStatus: Record<string, number> = {}
  for (const claim of state.claims) byStatus[claim.status] = (byStatus[claim.status] ?? 0) + 1
  res.end(JSON.stringify({
    ok: true,
    topic: state.topic,
    root: state.root,
    trust: state.briefingCache !== undefined ? 'high' : 'low',
    stats: { total: state.claims.length, byStatus },
    claims: state.claims.map(c => ({
      id: c.id, version: c.version, status: c.status, text: c.text,
      conventionId: c.conventionId, tolClass: c.tolClass,
      deriveRef: c.deriveRef, verifyRef: c.verifyRef,
      evidenceRefs: c.evidenceRefs, texRef: c.texRef, frozen: c.frozen,
    })),
    evidence: state.evidence.map(e => ({
      id: e.id, claimId: e.claimId, source: e.source, year: e.year, stance: e.stance, link: e.link ?? null,
    })),
    adjudications: state.adjudications.map(a => ({
      claim: a.claim, verdict: a.verdict, by: a.by, at: a.at, note: a.note,
    })),
  }))
}

/** POST /research-bench/adjudicate — 工作台人工裁决（signature token 校验，与 rb_adjudicate 同语义）。 */
async function adjudicateHandler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
  const fail = (error: string): void => { res.end(JSON.stringify({ ok: false, error })) }
  if (req.method !== 'POST') { fail('method must be POST'); return }
  let body: unknown
  try { body = await readJsonBody(req) } catch { fail('invalid JSON body'); return }
  if (typeof body !== 'object' || body === null) { fail('body must be a JSON object'); return }
  const record = body as Record<string, unknown>
  const claimId = record.claim_id
  const verdict = record.verdict
  const token = record.signature_token
  const note = typeof record.note === 'string' ? record.note : undefined
  if (typeof claimId !== 'string' || typeof verdict !== 'string' || typeof token !== 'string') {
    fail('body requires { claim_id: string, verdict: string, signature_token: string }')
    return
  }
  if (verdict !== 'accepted' && verdict !== 'limited' && verdict !== 'rejected') {
    fail(`verdict 必须是 accepted/limited/rejected，得到 ${verdict}`)
    return
  }
  const root = getCurrentBenchRoot()
  const state = root !== null ? readState(root) : null
  if (state === null || root === null) { fail('未打开课题（先用 rb_open 立项）'); return }
  const claim = findClaim(state, claimId)
  if (claim === undefined) { fail(`claim ${claimId} 不存在`); return }
  if (claim.status !== 'evidenced') {
    fail(`claim ${claimId} 状态为 ${claim.status}，需 evidenced 才能裁决`)
    return
  }
  if (!signatureTokens.consume(token, claimId, claim.version)) {
    fail('NEEDS_HUMAN_SIGNATURE: 令牌缺失/过期/不匹配')
    return
  }
  state.adjudications.push({
    claim: claimId, verdict, by: 'human', at: localIso(), ...(note === undefined ? {} : { note }),
  })
  const next = transition(claim.status, 'adjudicate')
  if (next === null) { fail(`claim ${claimId} 状态不允许裁决`); return }
  claim.status = next
  claim.frozen = true
  pushOpLog(state, 'rb_adjudicate', 'ai', `verdict=${verdict}`, claimId)
  writeState(root, state)
  res.end(JSON.stringify({ ok: true, claim_id: claimId, verdict, status: claim.status }))
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
    ctx.effect(() => ctx.webServer.register({
      kind: 'exact',
      path: '/research-bench/state',
      handler: stateHandler,
    }), 'dsh-ventus-research: state route')
    ctx.effect(() => ctx.webServer.register({
      kind: 'exact',
      path: '/research-bench/adjudicate',
      handler: adjudicateHandler,
    }), 'dsh-ventus-research: adjudicate route')
  }
}
