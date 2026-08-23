/**
 * Durable plugin state for dsh-ventus-search: master switch + per-engine
 * enabled/health/lastOkAt/lastError, persisted as human-readable JSON with an
 * atomic same-directory replace. Old flat-string engine health values are
 * migrated to the object form on load.
 * @module dsh-ventus-search/state
 */
/** Health of one search engine as reported by the last search pass. */
export type EngineHealth = 'ok' | 'fail' | 'untested';
/** Per-engine state: config is the hard default, this file is the runtime override. */
export interface EngineState {
    /** Runtime enable switch (PATCH engines.{id}); config AND this must be true. */
    enabled: boolean;
    /** Last reported health: ok / fail / untested. */
    health: EngineHealth;
    /** ISO timestamp of the last successful engine run, or null. */
    lastOkAt: string | null;
    /** Truncated error message of the last failed run, or null. */
    lastError: string | null;
}
/** Per-engine state map kept in the state file. */
export interface EngineHealthMap {
    bing: EngineState;
    so360: EngineState;
    bilibili: EngineState;
}
/** Whole plugin state: master switch, engines, and last write time. */
export interface VentusState {
    enabled: boolean;
    engines: EngineHealthMap;
    updatedAt: string;
}
/** Engine ids written back from the search provider. */
export type EngineId = 'bing' | 'so360' | 'bilibili';
/** Fresh per-engine state. */
export declare function defaultEngineState(enabled?: boolean): EngineState;
/** Fresh default state (all engines enabled and untested). */
export declare function defaultState(enabled?: boolean): VentusState;
/** In-memory state with atomic file persistence (temp file + fsync + rename). */
export declare class StateStore {
    private readonly filePath;
    private state;
    constructor(filePath: string);
    /** Read the state file once (or initialize defaults) and keep it in memory. */
    load(fallbackEnabled?: boolean): VentusState;
    /** Immutable snapshot of the current state. */
    get(): VentusState;
    /** Flip the master switch and persist. */
    setEnabled(enabled: boolean): VentusState;
    /** Flip one engine's runtime enable switch and persist. */
    setEngineEnabled(engine: EngineId, enabled: boolean): VentusState;
    /**
     * Record one engine's health and persist. A success refreshes lastOkAt and
     * clears lastError; a failure stores the (caller-truncated) error message.
     */
    setEngineHealth(engine: EngineId, health: EngineHealth, lastError?: string | null): VentusState;
    /** Atomic replace: write a temp file in the same directory, fsync, then rename. */
    private persist;
}
