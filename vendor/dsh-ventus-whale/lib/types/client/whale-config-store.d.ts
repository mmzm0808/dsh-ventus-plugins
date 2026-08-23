/**
 * Shared whale-config cache (t9).
 *
 * The whale config is prefetched at plugin activation so the settings card
 * renders immediately when the settings dialog opens — the same "data ready
 * before the card mounts" timing the web-ui family cards get from their
 * settings bridge. The official settings RPC cannot serve third-party
 * namespaces on this host (the apiproxy settings allowlist is hard-coded, and
 * the web-ui bridge allowlist does not include ventus-whale), so the ventus
 * card prefetches its own endpoint into this store instead.
 */
import type { WhaleConfig } from '../protocol.ts';
/** One cache snapshot. */
export interface ConfigSnapshot {
    /** 'ready' once a value stands; 'unavailable' after a failed prefetch. */
    status: 'loading' | 'ready' | 'unavailable';
    /** The last accepted config, or null before the first acceptance. */
    value: WhaleConfig | null;
}
/** @returns the current sync snapshot (stable reference until the next change). */
export declare function getConfigSnapshot(): ConfigSnapshot;
/**
 * Observe snapshot replacements.
 * @param listener - invoked after each snapshot change.
 * @returns the disposer removing this listener.
 */
export declare function subscribeConfig(listener: () => void): () => void;
/** External writers (e.g. WhalePet's own load) publish their accepted config. */
export declare function publishConfig(config: WhaleConfig): void;
/** Prefetch the config (idempotent; deduplicates in-flight loads). */
export declare function ensureConfigLoaded(): void;
