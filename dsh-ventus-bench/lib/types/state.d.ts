import type { ClaimStatus } from './gates.js';
/** 状态文件名（设计稿唯一可信源）。 */
export declare const STATE_FILE = ".rb-state.json";
/** 目录契约（设计稿基线）。 */
export declare const TOPIC_DIRS: readonly ["sim", "data", "figs", "notes"];
/** notes 下的子目录。 */
export declare const NOTES_SUBDIRS: readonly ["derivations"];
/** 口径声明（设计稿 4.1 conventions[]）。 */
export interface Convention {
    id: string;
    desc?: string;
    params?: Record<string, string | number>;
}
/** 一条可验证断言（设计稿 4.1 claims[]）。 */
export interface Claim {
    id: string;
    version: number;
    status: ClaimStatus;
    text: string;
    conventionId?: string;
    tolClass: string;
    deriveRef?: string;
    verifyRef?: string;
    evidenceRefs: string[];
    texRef?: string;
    frozen: boolean;
    supersededBy?: string | null;
}
/** 三类资产登记（设计稿 4.1 assets[] / R2）。 */
export interface Asset {
    id: string;
    kind: 'derivation' | 'verifier' | 'evidence-card';
    path: string;
    tags: string[];
    reusable: boolean;
    claimId?: string;
    hash: string;
}
/** 文献/证据卡（设计稿 4.1 evidence[]）。 */
export interface Evidence {
    id: string;
    claimId: string;
    source: string;
    year?: number;
    ref?: string;
    link?: string | null;
    relation?: string;
    /** support/limit/counter 需人工确认后才可进裁决；pending 为未确认。 */
    stance: 'support' | 'limit' | 'counter' | 'pending';
    verifiedBy?: string;
}
/** 人工裁决记录（设计稿 4.1 adjudications[]）。 */
export interface Adjudication {
    claim: string;
    verdict: 'accepted' | 'limited' | 'rejected';
    by: string;
    at: string;
    note?: string;
}
/** LaTeX 编译记录（设计稿 4.1 build_log[]）。 */
export interface BuildLogEntry {
    at: string;
    pdf?: string;
    pages?: number;
    targetPages: number;
    exit: number;
    status: string;
}
/** 操作日志（设计稿 4.1 ops_log[] / MVP#7）。 */
export interface OpLogEntry {
    at: string;
    action: string;
    by: 'ai' | 'human';
    claimId?: string;
    detail?: string;
}
/** 待人工确认写入 dsh-memory 的事实（rb_memory_sync 暂存）。 */
export interface PendingMemory {
    text: string;
    projectScope: boolean;
    at: string;
}
/** 顶层状态（设计稿 4.1）。 */
export interface RbState {
    schema: 'rb/1';
    topic: string;
    root: string;
    conventions: Convention[];
    claims: Claim[];
    assets: Asset[];
    evidence: Evidence[];
    adjudications: Adjudication[];
    buildLog: BuildLogEntry[];
    opsLog: OpLogEntry[];
    lastOpened?: string;
    briefingCache?: string;
    pendingMemory: PendingMemory[];
}
/** 资产扫描的待入库候选（设计稿 4.5）。 */
export interface PendingAsset {
    path: string;
    kind: 'derivation' | 'verifier' | 'evidence-card';
    hash: string;
}
/** 目录契约内的根目录路径。 */
export declare function topicRoot(cwd: string, topic: string): string;
/** 读取状态；不存在或解析失败返回 null（trust: low 由调用方判断）。 */
export declare function readState(root: string): RbState | null;
/** 写盘（原子发布）。 */
export declare function writeState(root: string, state: RbState): void;
/** 全新状态（设计稿 4.1 缺省形状）。 */
export declare function createEmptyState(topic: string, root: string): RbState;
/** 建立目录契约结构（幂等）。 */
export declare function ensureTopicDirs(root: string): void;
/** 下一个 claim 编号（C-001、C-002…，按现有最大号 +1）。 */
export declare function nextClaimId(state: RbState): string;
/** 下一个证据编号（E-001…）。 */
export declare function nextEvidenceId(state: RbState): string;
/** 下一个资产编号（asset-<kind>-001…）。 */
export declare function nextAssetId(state: RbState, kind: Asset['kind']): string;
/** 查 claim。 */
export declare function findClaim(state: RbState, id: string): Claim | undefined;
/** 查口径声明。 */
export declare function findConvention(state: RbState, id: string): Convention | undefined;
/** 文件 SHA-256（资产登记用）。 */
export declare function sha256File(file: string): string;
/** 资产扫描（设计稿 4.5）：只找「未登记」候选，hash 去重。 */
export declare function scanAssets(root: string, state: RbState): PendingAsset[];
/** 追加一条操作日志（就地）。 */
export declare function pushOpLog(state: RbState, action: string, by: 'ai' | 'human', detail?: string, claimId?: string): void;
/** ISO 本地时间戳（含 ±HH:MM 偏移）。 */
export declare function localIso(): string;
