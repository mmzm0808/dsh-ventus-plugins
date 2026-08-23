/**
 * Shared wire types between the host half and the browser half of
 * dsh-ventus-whale. Type-only contract surface (no runtime imports).
 */
/** The whale pet's persisted configuration. */
export interface WhaleConfig {
    /** Master switch: show the pet at all. */
    enabled: boolean;
    /** Send a message → the whale flips. */
    flipOnSend: boolean;
    /** Relative scale of the pet (0.2–3.0, 1.0 = default). */
    scale: number;
    /** Drag sensitivity multiplier (0.2–5.0, 1.0 = default). */
    sensitivity: number;
    /** Text shown under the pet (empty = none). */
    caption: string;
    /** Free-position override: fixed x from the viewport left edge, px. When
     * set (with y), it wins over the default placement. Absent = default
     * (right-middle of the viewport). */
    x?: number;
    /** Free-position override: fixed y from the viewport top edge, px. */
    y?: number;
}
/**
 * Default configuration (also used as the schema's base values). The pet is
 * disabled by default (t10: summon via the sidebar toggle); when summoned
 * without a saved free position it appears at the viewport's right-middle
 * (right: 32px, top: 38%), clear of the corners. The caption is empty
 * (hidden) by default — the hover toolbar's 改名 edits it.
 */
export declare const DEFAULT_CONFIG: WhaleConfig;
/** One persisted state read/write response. */
export interface WhaleStateResponse {
    config: WhaleConfig;
}
