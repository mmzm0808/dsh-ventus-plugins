/**
 * dsh-ventus-research — 科研工作台主组件。
 *
 * 原生风格：全部使用 DSH 设计 token（--dsw-alias-* / --edge-accent），不固定
 * 颜色，随主题/皮肤适配。性能：claims 列表分页（20 条/页）、详情懒加载、
 * tab 挂载时读一次 state（不轮询）、列表项 memo。
 */
import { memo, useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react'
import type { PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import { setQuestionIndex, useQuestion } from './question-bridge.tsx'

export type ResearchWorkbenchProps = PropsRuntime<'conversation.view'>

/** host GET /research-bench/state 的返回形状。 */
interface StatePayload {
  ok: boolean
  topic?: string
  root?: string
  trust?: 'high' | 'low'
  error?: string
  stats?: { total: number; byStatus: Record<string, number> }
  claims?: ClaimRow[]
  evidence?: EvidenceRow[]
  adjudications?: AdjRow[]
}

interface ClaimRow {
  id: string
  version: number
  status: string
  text: string
  conventionId?: string
  tolClass: string
  deriveRef?: string
  verifyRef?: string
  evidenceRefs: string[]
  texRef?: string
  frozen: boolean
}

interface EvidenceRow {
  id: string
  claimId: string
  source: string
  year?: number
  stance: string
  link?: string | null
}

interface AdjRow {
  claim: string
  verdict: string
  by: string
  at: string
  note?: string
}

const PAGE_SIZE = 20

/** claim 状态 → 语义色（原生 token）。 */
const STATUS_COLOR: Record<string, string> = {
  draft: 'var(--dsw-alias-label-tertiary)',
  derived: 'var(--dsw-alias-label-secondary)',
  verified: 'var(--dsw-alias-state-success)',
  'needs-review': 'var(--dsw-alias-state-warning)',
  mismatch: 'var(--dsw-alias-state-danger)',
  evidenced: 'var(--dsw-alias-state-business-primary)',
  adjudicated: 'var(--dsw-alias-state-business-primary)',
  published: 'var(--dsw-alias-state-success)',
  superseded: 'var(--dsw-alias-label-tertiary)',
}

const statusColor = (status: string): string => STATUS_COLOR[status] ?? 'var(--dsw-alias-label-tertiary)'

// ---- 原生风格样式（design token，不固定颜色）----

const rootStyle: CSSProperties = {
  height: '100%',
  overflowY: 'auto',
  padding: '16px 18px 24px',
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  color: 'var(--dsw-alias-label-primary)',
  fontSize: 13,
  lineHeight: '20px',
}

const headerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  flexWrap: 'wrap',
}

const topicStyle: CSSProperties = {
  fontSize: 15,
  fontWeight: 600,
  color: 'var(--dsw-alias-label-primary)',
}

const trustBadge = (trust: 'high' | 'low' | undefined): CSSProperties => ({
  fontSize: 11,
  lineHeight: '18px',
  padding: '0 8px',
  borderRadius: 8,
  border: '1px solid var(--dsw-alias-border-l2)',
  color: trust === 'high'
    ? 'var(--dsw-alias-state-success)'
    : 'var(--dsw-alias-state-warning)',
  background: 'transparent',
})

const rootPathStyle: CSSProperties = {
  fontSize: 11,
  color: 'var(--dsw-alias-label-tertiary)',
  fontFamily: 'var(--ds-font-family-code, ui-monospace, monospace)',
  wordBreak: 'break-all',
}

const cardStyle: CSSProperties = {
  border: '1px solid var(--dsw-alias-border-l1)',
  borderRadius: 10,
  background: 'var(--dsw-alias-bg-layer-1)',
  padding: '12px 14px',
}

const cardTitleStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--dsw-alias-label-secondary)',
  marginBottom: 10,
}

const chipRowStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
}

const chip = (color: string): CSSProperties => ({
  fontSize: 12,
  lineHeight: '20px',
  padding: '0 10px',
  borderRadius: 99,
  border: '1px solid var(--dsw-alias-border-l2)',
  color,
  background: 'transparent',
})

const listStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
}

const rowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '7px 8px',
  borderRadius: 8,
  border: 'none',
  background: 'transparent',
  color: 'var(--dsw-alias-label-primary)',
  cursor: 'pointer',
  textAlign: 'left',
  width: '100%',
}

const rowHover: CSSProperties = {
  ...rowStyle,
  background: 'var(--dsw-alias-interactive-bg-hover)',
}

const statusDot = (status: string): CSSProperties => ({
  flex: 'none',
  width: 8,
  height: 8,
  borderRadius: '50%',
  background: statusColor(status),
  boxShadow: status === 'mismatch' ? '0 0 0 1px var(--dsw-alias-state-danger)' : 'none',
})

const rowIdStyle: CSSProperties = {
  flex: 'none',
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--dsw-alias-label-secondary)',
  fontVariantNumeric: 'tabular-nums',
}

const rowTextStyle: CSSProperties = {
  flex: '0 1 auto',
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}

const rowMetaStyle: CSSProperties = {
  flex: 'none',
  fontSize: 11,
  color: 'var(--dsw-alias-label-tertiary)',
  marginLeft: 'auto',
}

const pagerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  paddingTop: 8,
}

const pageBtnStyle: CSSProperties = {
  border: '1px solid var(--dsw-alias-border-l2)',
  background: 'transparent',
  color: 'var(--dsw-alias-label-primary)',
  borderRadius: 8,
  padding: '2px 10px',
  fontSize: 12,
  cursor: 'pointer',
}

const detailStyle: CSSProperties = {
  marginTop: 4,
  border: '1px solid var(--dsw-alias-border-l1)',
  borderRadius: 10,
  background: 'var(--dsw-alias-bg-layer-1)',
  padding: '12px 14px',
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
}

const kvStyle: CSSProperties = {
  display: 'flex',
  gap: 8,
  fontSize: 12,
  lineHeight: '20px',
}

const kvKeyStyle: CSSProperties = {
  flex: 'none',
  width: 84,
  color: 'var(--dsw-alias-label-tertiary)',
}

const kvValStyle: CSSProperties = {
  flex: 1,
  color: 'var(--dsw-alias-label-primary)',
  wordBreak: 'break-all',
}

const emptyStyle: CSSProperties = {
  padding: '28px 8px',
  textAlign: 'center',
  fontSize: 12,
  color: 'var(--dsw-alias-label-tertiary)',
}

const refreshBtnStyle: CSSProperties = {
  marginLeft: 'auto',
  border: '1px solid var(--dsw-alias-border-l2)',
  background: 'transparent',
  color: 'var(--dsw-alias-label-secondary)',
  borderRadius: 8,
  padding: '2px 12px',
  fontSize: 12,
  cursor: 'pointer',
}

// ---- 状态分布 chips ----

const StatusChips = memo(function StatusChips({ stats }: { stats: StatePayload['stats'] }) {
  if (stats === undefined) return null
  const entries = Object.entries(stats.byStatus)
  if (entries.length === 0) return null
  const advanced = ['verified', 'evidenced', 'adjudicated', 'published']
  const advancedCount = entries.filter(([s]) => advanced.includes(s)).reduce((a, [, c]) => a + c, 0)
  const pct = stats.total > 0 ? Math.round((advancedCount / stats.total) * 100) : 0
  return (
    <>
      <div style={chipRowStyle}>
        {entries.map(([status, count]) => (
          <span key={status} style={chip(statusColor(status))}>{status} · {count}</span>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
        <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'var(--dsw-alias-bg-module-platform)', overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: 'var(--dsw-alias-state-success)', transition: 'width .3s ease' }} />
        </div>
        <span style={{ fontSize: 11, color: 'var(--dsw-alias-label-tertiary)', whiteSpace: 'nowrap' }}>
          已验证以上 {advancedCount}/{stats.total}（{pct}%）
        </span>
      </div>
    </>
  )
})

// ---- 单条 claim 行（memo 防重渲染）----

const ClaimRow = memo(function ClaimRow({
  claim, active, onClick,
}: { claim: ClaimRow; active: boolean; onClick: () => void }) {
  const conv = claim.conventionId !== undefined ? ` [${claim.conventionId}]` : ''
  return (
    <button type="button" style={active ? rowHover : rowStyle} onClick={onClick} title={claim.text}>
      <span style={statusDot(claim.status)} aria-hidden />
      <span style={rowIdStyle}>{claim.id}</span>
      <span style={rowTextStyle}>{claim.text}</span>
      <span style={rowMetaStyle}>v{claim.version}{conv}</span>
    </button>
  )
})

// ---- claim 详情（懒加载：选中才渲染）----

function ClaimDetail({ claim, evidence, adjudications, onChanged }: {
  claim: ClaimRow
  evidence: EvidenceRow[]
  adjudications: AdjRow[]
  onChanged: () => void
}) {
  const evs = evidence.filter(e => e.claimId === claim.id)
  const adjs = adjudications.filter(a => a.claim === claim.id)
  const [adjudicating, setAdjudicating] = useState(false)
  const [adjudicatingVerdict, setAdjudicatingVerdict] = useState<'accepted' | 'limited' | 'rejected'>('accepted')
  const [adjError, setAdjError] = useState('')

  const signAndAdjudicate = async (): Promise<void> => {
    setAdjudicating(true)
    setAdjError('')
    try {
      const sign = await fetch('/research-bench/sign', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ claim_id: claim.id, revision: claim.version }),
      }).then(r => r.json() as Promise<{ ok: boolean; token?: string; error?: string }>)
      if (sign.ok !== true || sign.token === undefined) {
        setAdjError(sign.error ?? '签发令牌失败')
        return
      }
      const adj = await fetch('/research-bench/adjudicate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ claim_id: claim.id, verdict: adjudicatingVerdict, note: '', signature_token: sign.token }),
      }).then(r => r.json() as Promise<{ ok: boolean; error?: string }>)
      if (adj.ok !== true) {
        setAdjError(adj.error ?? '裁决失败')
        return
      }
      onChanged()
    } finally {
      setAdjudicating(false)
    }
  }

  return (
    <div style={detailStyle}>
      <div style={kvStyle}><span style={kvKeyStyle}>状态</span><span style={{ ...kvValStyle, color: statusColor(claim.status) }}>{claim.status}</span></div>
      <div style={kvStyle}><span style={kvKeyStyle}>口径</span><span style={kvValStyle}>{claim.conventionId ?? '未声明'}</span></div>
      <div style={kvStyle}><span style={kvKeyStyle}>误差档</span><span style={kvValStyle}>{claim.tolClass}</span></div>
      {claim.deriveRef !== undefined && <div style={kvStyle}><span style={kvKeyStyle}>推导</span><span style={kvValStyle}>{claim.deriveRef}</span></div>}
      {claim.verifyRef !== undefined && <div style={kvStyle}><span style={kvKeyStyle}>验证</span><span style={kvValStyle}>{claim.verifyRef}</span></div>}
      {claim.texRef !== undefined && <div style={kvStyle}><span style={kvKeyStyle}>成稿</span><span style={kvValStyle}>{claim.texRef}</span></div>}
      {evs.length > 0 && (
        <div style={kvStyle}>
          <span style={kvKeyStyle}>证据</span>
          <span style={{ ...kvValStyle, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {evs.map(e => (
              <span key={e.id}>
                {e.source}{e.stance !== 'pending' ? `（${e.stance}）` : ''}
                {e.link !== null && e.link !== undefined && (
                  <button type="button" style={{ ...pageBtnStyle, marginLeft: 6, padding: '0 6px', fontSize: 11 }} onClick={() => { window.open(e.link, '_blank', 'noopener') }}>打开</button>
                )}
              </span>
            ))}
          </span>
        </div>
      )}
      {adjs.length > 0 && (
        <div style={kvStyle}>
          <span style={kvKeyStyle}>裁决</span>
          <span style={kvValStyle}>{adjs.map(a => `${a.verdict} · ${a.by} · ${a.at}`).join('；')}</span>
        </div>
      )}
      {claim.status === 'evidenced' && (
        <div style={{ ...kvStyle, alignItems: 'center' }}>
          <span style={kvKeyStyle}>裁决签字</span>
          <span style={{ ...kvValStyle, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <select
              value={adjudicatingVerdict}
              disabled={adjudicating}
              onChange={(e) => { setAdjudicatingVerdict(e.target.value as 'accepted' | 'limited' | 'rejected') }}
              style={{ border: '1px solid var(--dsw-alias-border-l2)', background: 'var(--dsw-alias-bg-layer-1)', color: 'var(--dsw-alias-label-primary)', borderRadius: 8, padding: '2px 8px', fontSize: 12 }}
            >
              <option value="accepted">接受</option>
              <option value="limited">限定</option>
              <option value="rejected">拒绝</option>
            </select>
            <button type="button" style={refreshBtnStyle} disabled={adjudicating} onClick={() => { void signAndAdjudicate() }}>
              {adjudicating ? '签字中…' : '签字裁决'}
            </button>
            {adjError !== '' && <span style={{ fontSize: 11, color: 'var(--dsw-alias-state-danger)' }}>{adjError}</span>}
          </span>
        </div>
      )}
    </div>
  )
}

// ---- AI 提问面板（AskUserQuestion 工作台作答）----

function QuestionPanel(): JSX.Element | null {
  const pending = useQuestion()
  const [picked, setPicked] = useState<Record<string, string[]>>({})
  const [submitting, setSubmitting] = useState(false)
  if (pending === null) return null
  const { wait, question, index } = pending
  const total = wait.payload.questions.length
  const options = question.options ?? []
  const selected = picked[question.id] ?? []

  const toggle = (label: string): void => {
    setPicked(prev => {
      const cur = prev[question.id] ?? []
      if (question.multiSelect) {
        return { ...prev, [question.id]: cur.includes(label) ? cur.filter(x => x !== label) : [...cur, label] }
      }
      return { ...prev, [question.id]: [label] }
    })
  }

  const submit = async (): Promise<void> => {
    if (submitting) return
    setSubmitting(true)
    const answers = wait.payload.questions.map(q => {
      const sel = picked[q.id] ?? []
      return sel.length > 0 ? { id: q.id, selected: sel } : { id: q.id, custom: '' }
    })
    try {
      await wait.respond({ ok: true, value: { sessionId: wait.sessionId, answer: { answers } } })
    } catch { /* 收据被拒 */ }
    setSubmitting(false)
  }

  const cancel = (): void => {
    void wait.respond({ ok: false, error: { code: 'cancelled', message: 'user closed', details: {} } })
  }

  return (
    <div style={cardStyle}>
      <div style={cardTitleStyle}>AI 提问（工作台作答）{total > 1 ? ` · ${index + 1}/${total}` : ''}</div>
      {question.header !== undefined && (
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--dsw-alias-label-primary)', marginBottom: 4 }}>{question.header}</div>
      )}
      <div style={{ fontSize: 13, color: 'var(--dsw-alias-label-primary)', marginBottom: 8 }}>{question.question}</div>
      {options.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {options.map(opt => (
            <label key={opt.label} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', cursor: 'pointer', fontSize: 12 }}>
              <input
                type={question.multiSelect ? 'checkbox' : 'radio'}
                checked={selected.includes(opt.label)}
                style={{ marginTop: 3 }}
                onChange={() => { toggle(opt.label) }}
              />
              <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ color: 'var(--dsw-alias-label-primary)' }}>{opt.label}</span>
                {opt.description !== undefined && (
                  <span style={{ fontSize: 11, color: 'var(--dsw-alias-label-tertiary)' }}>{opt.description}</span>
                )}
              </span>
            </label>
          ))}
        </div>
      )}
      {options.length === 0 && (
        <div style={{ fontSize: 12, color: 'var(--dsw-alias-label-tertiary)' }}>（无选项，直接提交或取消）</div>
      )}
      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        {index > 0 && <button type="button" style={pageBtnStyle} onClick={() => setQuestionIndex(index - 1)}>上一题</button>}
        {index < total - 1 && <button type="button" style={pageBtnStyle} onClick={() => setQuestionIndex(index + 1)}>下一题</button>}
        <button type="button" style={refreshBtnStyle} disabled={submitting} onClick={() => { void submit() }}>提交</button>
        <button type="button" style={pageBtnStyle} disabled={submitting} onClick={cancel}>取消</button>
      </div>
    </div>
  )
}

// ---- 工作台主组件 ----

export function ResearchWorkbench(_props: ResearchWorkbenchProps): JSX.Element | null {
  const [data, setData] = useState<StatePayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)

  const load = useCallback((): void => {
    setLoading(true)
    fetch('/research-bench/state', { cache: 'no-store' })
      .then(async res => res.json() as Promise<StatePayload>)
      .then((payload) => { setData(payload); setLoading(false) })
      .catch(() => { setData({ ok: false, error: '科研工作台服务不可达' }); setLoading(false) })
  }, [])

  useEffect(load, [load])

  const claims = data?.claims ?? []
  const totalPages = Math.max(1, Math.ceil(claims.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages - 1)
  const pageClaims = useMemo(
    () => claims.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE),
    [claims, safePage],
  )
  const selectedClaim = selected === null ? undefined : claims.find(c => c.id === selected)

  return (
    <div style={rootStyle}>
      <QuestionPanel />
      {data === null && loading && <div style={emptyStyle}>加载中…</div>}
      {data?.ok === false && <div style={emptyStyle}>{data.error ?? '未打开课题（先用 rb_open 立项）'}</div>}

      {data?.ok === true && (
        <>
          <div style={headerStyle}>
            <span style={topicStyle}>{data.topic}</span>
            <span style={trustBadge(data.trust)}>trust: {data.trust ?? 'low'}</span>
            <span style={rootPathStyle}>{data.root}</span>
            <button type="button" style={refreshBtnStyle} onClick={load}>刷新</button>
          </div>

          {data.stats !== undefined && data.stats.total > 0 && (
            <div style={cardStyle}>
              <div style={cardTitleStyle}>概览 · 共 {data.stats.total} 条 claim</div>
              <StatusChips stats={data.stats} />
            </div>
          )}

          {claims.length === 0 ? (
            <div style={emptyStyle}>暂无 claim — 让 AI 用 rb_open / rb_derive 建立科研课题</div>
          ) : (
            <div style={cardStyle}>
              <div style={cardTitleStyle}>claims</div>
              <div style={listStyle}>
                {pageClaims.map(claim => (
                  <ClaimRow
                    key={claim.id}
                    claim={claim}
                    active={claim.id === selected}
                    onClick={() => { setSelected(prev => prev === claim.id ? null : claim.id) }}
                  />
                ))}
              </div>
              {totalPages > 1 && (
                <div style={pagerStyle}>
                  <button type="button" style={pageBtnStyle} disabled={safePage === 0} onClick={() => setPage(safePage - 1)}>上一页</button>
                  <span style={{ fontSize: 12, color: 'var(--dsw-alias-label-tertiary)' }}>{safePage + 1} / {totalPages}</span>
                  <button type="button" style={pageBtnStyle} disabled={safePage >= totalPages - 1} onClick={() => setPage(safePage + 1)}>下一页</button>
                </div>
              )}
            </div>
          )}

          {selectedClaim !== undefined && (
            <ClaimDetail
              claim={selectedClaim}
              evidence={data.evidence ?? []}
              adjudications={data.adjudications ?? []}
              onChanged={load}
            />
          )}
        </>
      )}
    </div>
  )
}
