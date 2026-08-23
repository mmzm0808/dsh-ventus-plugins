/**
 * Durable plugin state for dsh-ventus-search: master switch + per-engine
 * enabled/health/lastOkAt/lastError, persisted as human-readable JSON with an
 * atomic same-directory replace. Old flat-string engine health values are
 * migrated to the object form on load.
 * @module dsh-ventus-search/state
 */
import { closeSync, existsSync, fsyncSync, mkdirSync, openSync, readFileSync, renameSync, writeFileSync, } from 'node:fs';
import { dirname } from 'node:path';
/** Fresh per-engine state. */
export function defaultEngineState(enabled = true) {
    return { enabled, health: 'untested', lastOkAt: null, lastError: null };
}
/** Fresh default state (all engines enabled and untested). */
export function defaultState(enabled = true) {
    return {
        enabled,
        engines: {
            bing: defaultEngineState(),
            so360: defaultEngineState(),
            bilibili: defaultEngineState(),
        },
        updatedAt: new Date().toISOString(),
    };
}
function isHealth(value) {
    return value === 'ok' || value === 'fail' || value === 'untested';
}
/** Tolerant parse of one engine entry: old flat string -> new object (enabled=true). */
function parseEngineState(value, fallback) {
    if (typeof value === 'string' && isHealth(value)) {
        return { enabled: true, health: value, lastOkAt: null, lastError: null };
    }
    if (typeof value !== 'object' || value === null)
        return { ...fallback };
    const raw = value;
    return {
        enabled: typeof raw.enabled === 'boolean' ? raw.enabled : fallback.enabled,
        health: isHealth(raw.health) ? raw.health : fallback.health,
        lastOkAt: typeof raw.lastOkAt === 'string' ? raw.lastOkAt : fallback.lastOkAt,
        lastError: typeof raw.lastError === 'string' ? raw.lastError : fallback.lastError,
    };
}
/** Tolerant parse of an on-disk state file; unknown/malformed fields fall back to defaults. */
function parseState(raw, fallbackEnabled) {
    const fallback = defaultState(fallbackEnabled);
    try {
        const parsed = JSON.parse(raw);
        const engines = parsed.engines;
        const enabled = typeof parsed.enabled === 'boolean' ? parsed.enabled : fallback.enabled;
        return {
            enabled,
            engines: {
                bing: parseEngineState(engines?.bing, fallback.engines.bing),
                so360: parseEngineState(engines?.so360, fallback.engines.so360),
                bilibili: parseEngineState(engines?.bilibili, fallback.engines.bilibili),
            },
            updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : fallback.updatedAt,
        };
    }
    catch {
        // Corrupt JSON must not block plugin activation; start from defaults.
        return fallback;
    }
}
/** In-memory state with atomic file persistence (temp file + fsync + rename). */
export class StateStore {
    filePath;
    state;
    constructor(filePath) {
        this.filePath = filePath;
        this.state = defaultState(true);
    }
    /** Read the state file once (or initialize defaults) and keep it in memory. */
    load(fallbackEnabled = true) {
        if (!existsSync(this.filePath)) {
            this.state = defaultState(fallbackEnabled);
            this.persist();
            return this.get();
        }
        try {
            this.state = parseState(readFileSync(this.filePath, 'utf8'), fallbackEnabled);
        }
        catch {
            this.state = defaultState(fallbackEnabled);
        }
        return this.get();
    }
    /** Immutable snapshot of the current state. */
    get() {
        return {
            enabled: this.state.enabled,
            engines: {
                bing: { ...this.state.engines.bing },
                so360: { ...this.state.engines.so360 },
                bilibili: { ...this.state.engines.bilibili },
            },
            updatedAt: this.state.updatedAt,
        };
    }
    /** Flip the master switch and persist. */
    setEnabled(enabled) {
        this.state = { ...this.state, enabled, updatedAt: new Date().toISOString() };
        this.persist();
        return this.get();
    }
    /** Flip one engine's runtime enable switch and persist. */
    setEngineEnabled(engine, enabled) {
        this.state = {
            ...this.state,
            engines: { ...this.state.engines, [engine]: { ...this.state.engines[engine], enabled } },
            updatedAt: new Date().toISOString(),
        };
        this.persist();
        return this.get();
    }
    /**
     * Record one engine's health and persist. A success refreshes lastOkAt and
     * clears lastError; a failure stores the (caller-truncated) error message.
     */
    setEngineHealth(engine, health, lastError) {
        const current = this.state.engines[engine];
        this.state = {
            ...this.state,
            engines: {
                ...this.state.engines,
                [engine]: {
                    ...current,
                    health,
                    lastOkAt: health === 'ok' ? new Date().toISOString() : current.lastOkAt,
                    lastError: health === 'fail' ? (lastError ?? null) : null,
                },
            },
            updatedAt: new Date().toISOString(),
        };
        this.persist();
        return this.get();
    }
    /** Atomic replace: write a temp file in the same directory, fsync, then rename. */
    persist() {
        mkdirSync(dirname(this.filePath), { recursive: true });
        const temp = this.filePath + '.tmp';
        const fd = openSync(temp, 'w');
        try {
            writeFileSync(fd, JSON.stringify(this.state, null, 2));
            fsyncSync(fd);
        }
        finally {
            closeSync(fd);
        }
        renameSync(temp, this.filePath);
    }
}
//# sourceMappingURL=state.js.map