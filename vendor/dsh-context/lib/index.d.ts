import { ZodType, z } from "zod";
import { Session, SessionEvent } from "@deepseek-ai/dsh-session";
import { Context, Service } from "@deepseek-ai/cordis";
//#region src/host/config.d.ts
interface Config {
  /** Cap on kept per-step request records (the hard step backstop). */
  maxRequestSteps?: number;
  /** Newest whole-turn window kept; trimming crosses whole turns, never mid-turn. */
  maxKeptTurns?: number;
  maxEvents?: number;
  /**
   * Served surface nodes (newest carry the signal; live inject nodes are pinned — they land first and are few). Deliberately generous:
   * auto-compaction keeps healthy surfaces far below it, so the browser effectively lists every live node; the bound is a
   * pathological-session backstop (each push ships the whole value, ~150B/node).
   */
  maxNodes?: number;
  /** Removed (shadowed) surface nodes kept for per-step reconstruction. */
  maxArchiveNodes?: number;
}
/**
 * The cordis `Config` validator: strict on keys, defaults on the schema fields; tolerates `undefined` (a patch row without a `config:`
 * block — defaults win).
 */
declare const Config: z.ZodPreprocess<z.ZodObject<{
  maxRequestSteps: z.ZodDefault<z.ZodNumber>;
  maxKeptTurns: z.ZodDefault<z.ZodNumber>;
  maxEvents: z.ZodDefault<z.ZodNumber>;
  maxNodes: z.ZodDefault<z.ZodNumber>;
  maxArchiveNodes: z.ZodDefault<z.ZodNumber>;
}, z.core.$strict>>;
//#endregion
//#region src/shared/types.d.ts
/**
 * Shared wire contract — the snapshot model exchanged between the Host and Client halves. Delivered as the `view()` payload of the
 * `contextTimeline`/`contextHeaders` session projections (registered on `ctx.sessionProjections`; the registry pushes finished views as
 * `session/projection` frames — see host/timeline.ts). TYPE-ONLY host-side module: both halves import these as `import type`, so nothing
 * from here ever reaches the runtime bundles.
 */
declare module '@deepseek-ai/dsh-session-projection/types' {
  interface SessionProjectionMap {
    /**
     * The plugin's whole-value context timeline: current composition,
     * per-request history, context events, and the model-visible surface.
     * The Host folds it from the session log; clients receive the finished
     * value (key absence = the plugin's host half is not composed).
     */
    contextTimeline: ContextTimeline;
    /**
     * The request-header CONTENT epochs (full system prompt + tool schemas)
     * behind the timeline's envelope figures. A separate unit so the hot
     * `contextTimeline` value stays lean: headers change rarely, so this
     * value (and its pushes) change only when a `request/header` lands.
     * The Context browser card reads it to show the actual prompt/schema
     * content of a picked step (key absence = older host: tokens only).
     */
    contextHeaders: ContextHeaders;
  }
}
type Category = 'user' | 'inject' | 'assistant' | 'tool';
interface Snapshot {
  ok: boolean;
  model?: string;
  provider?: string;
  contextWindow?: number;
  current: {
    system: number;
    tools: number;
    user: number;
    inject: number;
    assistant: number;
    tool: number;
    total: number;
  };
  /**
   * Provider-anchored occupancy of the NEXT request. LEGACY since 0.11: the
   * Host no longer folds this — the Client reads the official token-meter
   * `contextPressure` projection key (`useProjection('contextPressure')`)
   * instead. Kept optional for wire compatibility with older clients.
   */
  occupancy?: {
    pressureTokens?: number;
    surfaceTokens: number;
    sampledSurfaceTokens?: number;
    projectedTokens?: number;
    contextWindow?: number;
  };
  toolList: {
    name: string;
    tokens: number;
  }[];
  /**
   * Image blocks live in the CURRENT context (user uploads plus tool-result
   * images, nested blocks included) — the sum over the live surface nodes'
   * `imgs`, so compaction/prune shrink it. Absent from older hosts; clients
   * treat absence as zero.
   */
  images?: number;
  /**
   * Tool calls whose result is live in the CURRENT context (one `tool/result`
   * folds to one `tool` surface node). Calls still in flight and results
   * compacted/pruned out of the surface are not counted. Absent from older
   * hosts; clients treat absence as zero.
   */
  toolCalls?: number;
  requests: RequestRecord[];
  events: ContextEventRecord[];
  /**
   * Cumulative session-cost raw material (per-family, per-period billed
   * token totals — see SessionCostUsage). Absent until a DeepSeek V4
   * request reports usage.
   */
  cost?: SessionCostUsage;
  /**
   * The served live surface: the newest `maxNodes` tail PLUS every live inject node older than the tail (injections land first and are
   * few,
   * so they are pinned). Seq-ordered, oldest first.
   */
  nodes: SurfaceNode[];
  /** Live nodes not served (the overflow beyond `maxNodes`, minus pinned injects — see `nodes`). */
  droppedNodes: number;
  /**
   * Recently REMOVED surface nodes (compaction/prune shadows), each stamped
   * with `gone` (the replacing event's seq). Together with `nodes` this lets
   * the Context browser reconstruct the assembled surface of any retained
   * step: alive at request R = seq < R.seq && (gone undefined || gone > R.seq).
   */
  archive: SurfaceNode[];
  /**
   * Coverage floor of the served live `nodes`: the newest seq among the
   * `droppedNodes` live nodes not served. Present only when droppedNodes > 0.
   */
  surfaceFloor?: number;
  /**
   * Coverage floor of `archive`: the newest `gone` among archive entries the
   * retention bounds dropped. Steps with seq < archiveFloor may miss removed
   * nodes (the browser shows the reconstruction as approximate).
   */
  archiveFloor?: number;
}
/**
 * The `contextTimeline` projection's whole value — the same snapshot the Client has always rendered. `ok` is always `true` here (a
 * delivered projection is by definition available); kept for wire compatibility with the snapshot shape.
 */
type ContextTimeline = Snapshot;
/**
 * Cumulative billed-token totals for one pricing bucket of the session-cost
 * estimate (host-folded, never trimmed — running totals over the COMPLETE
 * session log, immune to the request/event retention bounds).
 */
interface CostBucketTotals {
  uncached: number;
  cacheRead: number;
  cacheWrite: number;
  output: number;
}
/** One model family's totals split by DeepSeek's pricing period (Beijing Time). */
interface CostFamilyUsage {
  peak?: CostBucketTotals;
  off?: CostBucketTotals;
}
/**
 * The session-cost estimate's raw material: cumulative provider-reported
 * token totals per DeepSeek V4 model family (matched on the model NAME,
 * provider-agnostic) and pricing period. The Client prices these with its
 * hardcoded list-price table in the locale's currency. Absent until a
 * deepseek-v4-flash / deepseek-v4-pro request reports usage.
 */
interface SessionCostUsage {
  flash?: CostFamilyUsage;
  pro?: CostFamilyUsage;
}
/** One model-visible message on the surface, with its heuristic token price. */
interface SurfaceNode {
  seq: number;
  time?: number;
  cat: Category;
  tokens: number;
  /** Image blocks inside this node's message (absent when zero). */
  imgs?: number;
  /**
   * Removal marker, present only on `archive` entries: the seq of the
   * replacement surface event that shadowed this node (compaction/prune).
   * The node is part of the assembled context of every request with
   * seq > this node.seq and seq < gone.
   */
  gone?: number;
  form?: string;
  text?: string;
  tool?: string;
  err?: boolean;
  skill?: string;
  calls?: string[];
}
/** One answered model call (a step); consecutive records of one turn form it. */
interface RequestRecord {
  turn?: number;
  step?: number;
  time: number;
  seq: number;
  system: number;
  tools: number;
  user: number;
  inject: number;
  assistant: number;
  tool: number;
  total: number;
  prompt?: number;
  /**
   * Billed cache-read (served) prompt tokens of this request — the
   * hit-rate numerator against `prompt` (input + cacheRead + cacheWrite).
   * Absent on older hosts / usage-less requests; zero is a real value.
   */
  cacheRead?: number;
  output?: number;
  /**
   * Turn-mode aggregate marker, set by the Client's aggregateByTurn (one bar
   * per turn shows its LAST step's record). The Host never sets it.
   */
  stepCount?: number;
  /**
   * Delta-mode signed net change, set by the Client's deltaOf (only present
   * on the delta-transformed records the TrendChart plots). The Host never
   * sets it.
   */
  net?: number;
}
/** A notable context event (compaction, prune, injection, model switch). */
interface ContextEventRecord {
  seq: number;
  time: number;
  kind: 'compaction' | 'prune' | 'inject' | 'model' | 'mode';
  form?: string;
  tokens?: number;
  count?: number;
  sub?: string;
  name?: string;
  /** One-line producer account (notice-form summary), shown after the name. */
  detail?: string;
  from?: string;
  to?: string;
  /** Turn/step of the request logged right BEFORE the event (host-stamped). */
  fromTurn?: number;
  fromStep?: number;
  /** Turn/step of the request this event contributed to (host-stamped). */
  turn?: number;
  step?: number;
}
/** One tool schema as assembled into a request header, with its display price. */
interface HeaderTool {
  name: string;
  tokens: number;
  /** Producer-declared description (may be long; the browser truncates). */
  description?: string;
  /** The raw JSON schema object the model received (plain JSON). */
  schema?: unknown;
}
/**
 * One request-header epoch: the full system prompt and tool schemas in force from this event's seq until the next epoch.
 */
interface HeaderRecord {
  seq: number;
  time: number;
  system?: string;
  tools: HeaderTool[];
}
/** The `contextHeaders` projection value: the bounded epoch list (newest last). */
interface ContextHeaders {
  headers: HeaderRecord[];
}
//#endregion
//#region src/host/fold.d.ts
/**
 * History retention bounds (configurable since 0.11 — see config.ts; these
 * are the defaults' values). The fold keeps per-STEP request records; once the
 * newest run count exceeds `maxKeptTurns`, the timeline is trimmed to the
 * most recent whole TURN runs (never cutting a turn in half), so turn
 * granularity can always show the full recent turn range instead of a
 * step-count fragment. The turn-run trim runs whenever the cap is crossed
 * (not only when the raw step bound is), so the bounded state stays at the
 * newest ~`maxKeptTurns` turns deterministically as a live log grows.
 */
interface TimelineState {
  /** Model-visible surface, newest last. */
  surface: SurfaceNode[];
  sums: Record<Category, number>;
  systemTokens: number;
  toolsTokens: number;
  toolList: {
    name: string;
    tokens: number;
  }[];
  /**
   * The projection-cache precondition is plain JSON: a property whose value
   * is `undefined` makes the whole checkpoint unserializable
   * (`snapshotJsonValue` rejects it), which fails EVERY cache write for the
   * session — including the `title` projection row that powers the session
   * list after a restart. Optional fields therefore use absent properties
   * (`model`/`provider`/`lastModel`/`contextWindow` are simply not set until
   * a value is known) instead of `undefined`-valued ones. Reads via
   * `state.model` are identical for both shapes (`undefined` on miss).
   */
  model?: string;
  provider?: string;
  lastModel?: string;
  contextWindow?: number;
  requests: RequestRecord[];
  events: ContextEventRecord[];
  /**
   * Recently removed surface nodes (stamped COPIES carrying `gone`), in
   * removal order. Feeds the Context browser's per-step reconstruction.
   * Bounded two ways in trimState: capped to `maxArchiveNodes`, and pruned
   * to removals after the oldest retained request (older removals can only
   * serve steps the requests trim already forgot).
   */
  archived: SurfaceNode[];
  /**
   * Session-cost raw material: cumulative billed-token totals per DeepSeek
   * V4 model family and pricing period (see SessionCostUsage). Running
   * totals — never trimmed, so the estimate always covers the COMPLETE
   * session log even after the request/event retention bounds cut in.
   * Absent until a v4-flash / v4-pro request reports usage.
   */
  cost?: SessionCostUsage;
  archiveFloor?: number;
  /**
   * Tool callId → name, armed by `tool/call` and DELETED when its
   * `tool/result` folds in (one result per call, in log order) — the map
   * stays at pending-call size instead of growing for the session's whole
   * lifetime (it is persisted state, shallow-copied by every fold step).
   */
  callNames: Record<string, string>;
  /**
   * Seq list of the surface nodes the next replacement will shadow, armed by
   * the metering event (`compaction/summary` | `compaction/prune`) and
   * consumed by the replacement that must follow it synchronously. The
   * producer's shadow price covers exactly these seqs — which can differ
   * from the replacement's declared range (pruned replacement nodes keep
   * their own seqs, beyond the range end) — so removal must follow the seqs.
   * Absent until armed, and REMOVED (not set to `undefined`) when consumed,
   * to keep the state plain JSON for the projection cache.
   */
  pendingShadowedSeqs?: number[];
  /**
   * The seq of the compaction/prune event that armed `pendingShadowedSeqs` —
   * the shadowed path rewrites that event's `tokens` from the gross shadow
   * price to the NET freed amount (removed nodes minus the synchronous
   * replacement), so the row matches the drop the trend chart shows. Same
   * arm/remove lifecycle as `pendingShadowedSeqs`.
   */
  pendingShadowEventSeq?: number;
}
//#endregion
//#region node_modules/.pnpm/@deepseek-ai+dsh-session-pr_c0ffab70d18276fadfe75ed916313ea3/node_modules/@deepseek-ai/dsh-session-projection/lib/types/types.d.ts
/**
 * Pure-type outlet of the session-projection Service Definition: the one projection type
 * table, importable from client aggregates without dragging the host-side
 * cordis Context merges of the package root (dsh-agent → dsh-session). Domain
 * packages may declare-merge through either the package root or this outlet —
 * re-export preserves symbol identity, so both land on the same table.
 *
 * @module @deepseek-ai/dsh-session-projection/types
 */
/**
 * The single projection type table for the whole chain (host provider, wire
 * block, client cell, React hook). Domain packages merge their key here via
 * declaration merging; values are wire-JSON whole values. How a value is
 * rendered is the slot system's business, never this layer's.
 */
interface SessionProjectionMap {}
//#endregion
//#region node_modules/.pnpm/@deepseek-ai+dsh-session-pr_c0ffab70d18276fadfe75ed916313ea3/node_modules/@deepseek-ai/dsh-session-projection/lib/types/index.d.ts
declare module '@deepseek-ai/cordis' {
  interface Context {
    sessionProjections: SessionProjectionRegistry;
  }
}
/**
 * One domain's state-driven computation unit: three pure synchronous
 * functions plus declarations — never an opaque getter. The framework drives
 * `apply` on every committed session event; the domain holds no
 * subscriptions and owns only the mathematics. All three functions MUST be
 * synchronous (an async unit would tear the carriers' consistency cut) and
 * `state` MUST be plain JSON (the persisted-cache precondition).
 */
interface ProjectionDefinition<K extends keyof SessionProjectionMap, S> {
  /** The projection key this unit owns (its `SessionProjectionMap` entry). */
  key: K;
  /** Validates the wire payload (`view` output) before it leaves the host. */
  schema: ZodType<SessionProjectionMap[K]>;
  /**
   * State for the empty log.
   * @returns the initial state.
   */
  init(): S;
  /**
   * Pure transition: previous state + one committed event → next state. A
   * unit uninterested in an event MUST return the same state reference — an
   * unchanged reference (`Object.is`) produces zero downstream work.
   * @param state - the state covering all prior events.
   * @param event - the next committed session event.
   * @returns the next state (same reference when the event is not the unit's).
   */
  apply(state: S, event: SessionEvent): S;
  /**
   * State → wire payload (the read-side projection).
   * @param state - the current state.
   * @returns the whole current value for this unit's key.
   */
  view(state: S): SessionProjectionMap[K];
  /**
   * Persisted-cache invalidation version: bump whenever the serialized state fields or the
   * fold semantics change, so persisted `(sessionId, key, ver, seq, val)`
   * rows from an older unit are discarded instead of being forward-applied
   * into garbage. Non-negative integer.
   */
  stateVersion: number;
}
/**
 * Change-feed listener: one unit's value changed for one session. `value` is
 * the schema-validated `view` output; `seq` is the unit's watermark at
 * emission (the seq of the event that caused the change).
 */
type ProjectionChangeListener = (session: Session, key: Extract<keyof SessionProjectionMap, string>, value: unknown, seq: number) => void;
/**
 * One consistent read cut over every registered unit for one session.
 * `asOfSeq` is the shared watermark — the seq of the last event every value
 * reflects (`-1` for an empty log, mirroring `session/subscribed.lastSeq`).
 */
interface ProjectionSnapshot {
  /** Seq of the last event the values reflect; -1 for an empty log. */
  asOfSeq: number;
  /** Whole current value per registered key. */
  values: Partial<SessionProjectionMap>;
}
/**
 * One unit's checkpoint: its internal state (plain JSON by the unit
 * contract), the seq of the last event folded into it, and the unit
 * `stateVersion` that produced it — the persisted projection-cache row
 * `(sessionId, key, ver, seq, val)` minus the two outer keys. A row is
 * never authoritative, only a fold shortcut: `restore` discards it on a
 * version mismatch or when it claims events past the stored log end.
 */
interface ProjectionCheckpointRow {
  /** The registering unit's `stateVersion` at fold time. */
  ver: number;
  /** Seq of the last event folded into `val`; -1 for the empty log. */
  seq: number;
  /** The unit's internal state — plain JSON per the unit contract. */
  val: unknown;
}
/** Checkpoint rows keyed by projection key (one session's persisted cache value). */
type ProjectionCheckpoint = Record<string, ProjectionCheckpointRow>;
/**
 * `ctx.sessionProjections`: the projection unit table and its drive. The
 * service subscribes to `session/event` once; every committed event passes
 * every registered unit's `apply` (eager drive), and a changed state
 * reference notifies the change feed with the schema-validated view.
 * Cells build lazily — a unit registered after events flowed, or a session
 * older than the registry, folds `init` over the in-memory log on first
 * touch (event or read). Registration is an effect (disposer rides the
 * calling fiber): an unloaded domain plugin's key disappears from snapshots
 * and clients read it as capability absence. Domain
 * plugins register under `ctx.inject(['sessionProjections'], …)` so headless
 * assemblies without the registry stay unaffected. Registrants sharing a key
 * share one unit and are counted: the same tool package mounted in N agent
 * presets registers N times, and the key survives until the last one
 * unloads.
 */
declare class SessionProjectionRegistry extends Service {
  private readonly registrations;
  private readonly listeners;
  /**
   * Create and install the registry as `ctx.sessionProjections`.
   * @param ctx - Cordis context that owns the service.
   */
  constructor(ctx: Context);
  /**
   * Register one domain's unit. The registration is an effect on the calling
   * context's fiber: disposing the fiber (or calling the returned disposer)
   * removes the key — and the unit's cached cells — from subsequent drives
   * and snapshots.
   * @param definition - key, state schema, pure unit functions, and stateVersion.
   * @returns the exact disposer that unregisters this unit.
   */
  register<K extends keyof SessionProjectionMap, S>(definition: ProjectionDefinition<K, S>): () => void;
  /**
   * Subscribe to the change feed. The registration is an effect on the
   * calling context's fiber.
   * @param listener - called once per unit whose state reference changed, per committed event.
   * @returns the exact disposer that unsubscribes.
   */
  onChanged(listener: ProjectionChangeListener): () => void;
  /**
   * One consistent cut over every registered unit for one session, read from
   * the watermark cache (missing cells fold lazily over the in-memory log).
   * Fully synchronous — every value and `asOfSeq` reflect the same log
   * position. Each value passes its unit's schema before leaving.
   * @param session - the session whose projection values are read.
   * @returns the snapshot; `values` is empty when no unit is registered.
   */
  snapshot(session: Session): ProjectionSnapshot;
  /**
   * State-level checkpoint of every registered unit for one session, read
   * from the watermark cache (missing cells fold lazily over the in-memory
   * log). This is the write side of the persisted projection cache: the
   * returned rows are the `(key → {ver, seq, val})` part of the durable
   * `(sessionId, key, ver, seq, val)`
   * rows. Every `val` is a DETACHED structured clone — never the live
   * cell reference: the watermark cache is this registry's authoritative
   * mutable state, and a caller reaching the live reference could corrupt
   * every subsequent snapshot and frame through it (plain JSON by the unit
   * contract, so the clone is total).
   * @param session - the session whose unit states are checkpointed.
   * @returns one row per registered key; empty when no unit is registered.
   */
  checkpoint(session: Session): ProjectionCheckpoint;
  /**
   * The stored seq a {@link restore} tail read over `checkpoint` must start
   * at: one event BELOW the lowest usable watermark (a row is usable when
   * its `ver` matches the live unit's `stateVersion`; an absent or mismatched row
   * pulls the floor to `0` — that key must refold the full log). The
   * one-below anchor is load-bearing: the tail then proves how far the
   * stored log still extends, so {@link restore} can detect a log that
   * shrank below a row's watermark (crash-repair truncation) instead of
   * serving the stale row as current — an empty tail read from the anchor
   * yields an end below every watermark and the restore rejects for a full
   * re-read.
   * @param checkpoint - persisted rows for one session (possibly stale or empty).
   * @returns the seq to hand the persistence `readFrom`, or `undefined`
   *   when no unit is registered (no read needed — {@link restore} would
   *   serve empty values regardless).
   */
  restoreFloor(checkpoint: ProjectionCheckpoint): number | undefined;
  /**
   * View a checkpoint's rows without any log read: for every registered
   * unit whose row's `ver` matches, serve the schema-validated
   * `view` of the stored state; mismatched or absent rows leave their key
   * absent (a cold or listing consumer treats it as not-yet-available and a
   * fuller read path refolds it). The zero-I/O rung of the read ladder —
   * values are as stale as their rows, never wrong.
   * @param checkpoint - persisted rows for one session (possibly stale or empty).
   * @returns whole values per key with a usable row; empty when none.
   */
  viewCheckpoint(checkpoint: ProjectionCheckpoint): Partial<SessionProjectionMap>;
  /**
   * Cold read: fold every registered unit over a stored log suffix, seeding
   * each from its checkpoint row when usable — the one read recipe (cached
   * state + forward tail replay + `view`) applied without a live `Session`.
   * Call with the events returned by a persistence
   * `readFrom(id, restoreFloor(checkpoint))` and that same floor as
   * `baseSeq`; the floor's one-below anchor makes the supplied end honest,
   * so a shrunk log is detected here. A row is usable iff its
   * `ver` matches the live unit's `stateVersion`, it does not predate `baseSeq`
   * (`seq >= baseSeq - 1`), and it does not claim events past the
   * supplied end (`seq <= endSeq`); an unusable row is discarded
   * and its key refolds from `init` — which is only sound over the full
   * log, so a discarded row with `baseSeq > 0` throws (the caller re-reads
   * from seq 0, e.g. after a crash-repair truncation shrank the log below
   * a row's watermark).
   * @param checkpoint - persisted rows for one session (possibly stale or empty).
   * @param events - the stored events with `seq >= baseSeq`, in seq order.
   * @param baseSeq - the seq `events` starts at (its first event's seq when non-empty).
   * @returns the snapshot cut at the supplied log end (`asOfSeq` is the last
   *   supplied event's seq, `baseSeq - 1` for an empty tail) plus the
   *   refreshed checkpoint rows at that cut, ready for a durable write-back.
   */
  restore(checkpoint: ProjectionCheckpoint, events: readonly SessionEvent[], baseSeq: number): {
    snapshot: ProjectionSnapshot;
    checkpoint: ProjectionCheckpoint;
  };
  /** Fold one unit from init over `events`, producing a cell watermarked at the last folded event. */
  private buildCell;
  /** Read (or lazily build, folding the full in-memory log) one unit's cell. */
  private cellFor;
  /** Eager drive: pass one committed event through every registered unit; notify on changed references. */
  private drive;
}
//#endregion
//#region src/host/headers.d.ts
interface HeadersState {
  headers: HeaderRecord[];
}
//#endregion
//#region src/host/index.d.ts
declare const name = "dsh-context";
declare const inject: string[];
declare function apply(ctx: Context, config: Config): void;
//#endregion
export { type Category, Config, type ContextEventRecord, type ContextHeaders, type ContextTimeline, type HeaderRecord, type HeaderTool, type HeadersState, type RequestRecord, type Snapshot, type SurfaceNode, type TimelineState, apply, inject, name };