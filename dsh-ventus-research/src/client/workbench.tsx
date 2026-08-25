/**
 * dsh-ventus-research — 科研工作台主组件。
 *
 * 原生风格：全部使用 DSH 设计 token（--dsw-alias-* / --edge-accent），不固定
 * 颜色，随主题/皮肤适配。性能：claims 列表分页（20 条/页）、详情懒加载、
 * tab 挂载时读一次 state（不轮询）、列表项 memo。
 */
import { memo, useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react'
import type { PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'

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
  return (
    <div style={chipRowStyle}>
      {entries.map(([status, count]) => (
        <span key={status} style={chip(statusColor(status))}>{status} · {count}</span>
      ))}
    </div>
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

function ClaimDetail({ claim, evidence, adjudications }: {
  claim: ClaimRow
  evidence: EvidenceRow[]
  adjudications: AdjRow[]
}) {
  const evs = evidence.filter(e => e.claimId === claim.id)
  const adjs = adjudications.filter(a => a.claim === claim.id)
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
          <span style={kvValStyle}>{evs.map(e => `${e.source}${e.stance !== 'pending' ? `（${e.stance}）` : ''}`).join('；')}</span>
        </div>
      )}
      {adjs.length > 0 && (
        <div style={kvStyle}>
          <span style={kvKeyStyle}>裁决</span>
          <span style={kvValStyle}>{adjs.map(a => `${a.verdict} · ${a.by} · ${a.at}`).join('；')}</span>
        </div>
      )}
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
            />
          )}
        </>
      )}
    </div>
  )
}
