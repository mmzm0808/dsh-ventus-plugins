/**
 * dsh-ventus-research — 科研工作流的纯函数闸门（无 IO，可独立单测）。
 *
 * 三个判定原语对应设计稿 4.3：
 *   verdict(err, band)      — 三向分流（PASS / WARN / FAIL）
 *   gateNoVerify(claim)     — 硬闸门（无 verify_ref 或未裁决不得写 tex）
 *   gateConvention(a, b)    — 口径拒绝（跨口径比较直接拒绝）
 * 外加 claim 8 态状态机的合法迁移表。
 */

/** 误差判定结果。 */
export type Verdict = 'PASS' | 'WARN' | 'FAIL'

/** 误差判定档位：pass=严格阈值，warn=警告阈值（超过即 FAIL）。 */
export interface TolBand {
  readonly pass: number
  readonly warn: number
}

/**
 * 三向分流（设计稿 4.3）：err <= pass → PASS；err <= warn → WARN；否则 FAIL。
 * 输入必须是有限非负误差；负数按 0 处理（完美匹配），NaN/Infinity 保守归 FAIL。
 */
export function verdict(err: number, band: TolBand): Verdict {
  const e = Number.isFinite(err) ? Math.max(0, err) : Number.POSITIVE_INFINITY
  if (e <= band.pass) return 'PASS'
  if (e <= band.warn) return 'WARN'
  return 'FAIL'
}

/** claim 生命周期状态（设计稿 4.1 / 第 2 节）。 */
export type ClaimStatus =
  | 'draft'
  | 'derived'
  | 'verified'
  | 'needs-review'
  | 'mismatch'
  | 'evidenced'
  | 'adjudicated'
  | 'published'
  | 'superseded'

/** 硬闸门（设计稿 4.3）：必须存在 verify_ref 且已人工裁决才放行写 tex。 */
export function gateNoVerify(claim: { verifyRef?: string | null; status: ClaimStatus }): 'PASS' | 'GATE_NO_VERIFY' {
  const ref = claim.verifyRef
  if (ref !== undefined && ref !== null && ref !== '' && claim.status === 'adjudicated') return 'PASS'
  return 'GATE_NO_VERIFY'
}

/** 口径拒绝（设计稿 4.3）：convention_id 必须一致；任何一侧未声明都保守拒绝。 */
export function gateConvention(a: string | undefined, b: string | undefined): 'PASS' | 'CONVENTION_MISMATCH' {
  if (a === undefined || a === '' || b === undefined || b === '') return 'CONVENTION_MISMATCH'
  return a === b ? 'PASS' : 'CONVENTION_MISMATCH'
}

/** 状态机动作（含 2 条旁路的 "review-fix" 人工诊断复位）。 */
export type RbAction =
  | 'derive'
  | 'verify-pass'
  | 'verify-warn'
  | 'verify-fail'
  | 'review-fix'
  | 'evidence'
  | 'adjudicate'
  | 'publish'
  | 'supersede'

/** 合法迁移表（设计稿第 2 节状态机）。 */
const TRANSITIONS: Record<ClaimStatus, Partial<Record<RbAction, ClaimStatus>>> = {
  draft: { derive: 'derived' },
  derived: {
    'verify-pass': 'verified',
    'verify-warn': 'needs-review',
    'verify-fail': 'mismatch',
  },
  'needs-review': { 'review-fix': 'derived', 'verify-pass': 'verified' },
  mismatch: { 'review-fix': 'derived', 'verify-pass': 'verified' },
  verified: { evidence: 'evidenced' },
  evidenced: { adjudicate: 'adjudicated' },
  adjudicated: { publish: 'published' },
  published: { supersede: 'superseded' },
  superseded: {},
}

/** 合法迁移返回新状态；非法动作返回 null（调用方据此拒绝并报错）。 */
export function transition(from: ClaimStatus, action: RbAction): ClaimStatus | null {
  return TRANSITIONS[from][action] ?? null
}
