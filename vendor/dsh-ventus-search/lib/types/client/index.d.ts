/**
 * dsh-ventus-search — browser half. Ventus-series settings card: master switch
 * (PATCH /api/ventus-search/state), per-engine enable toggles + health status
 * with polling, and a live test search (POST /api/ventus-search/test). All
 * fetches/timers/listeners are cleaned up with the client fiber.
 * @module dsh-ventus-search/client
 */
/** Minimal slots service face used by this plugin (avoids runtime imports). */
interface SlotsLike {
    inject(key: string, callback: () => () => void): () => void;
    register(options: {
        name: string;
        id: string;
        order?: number;
        label?: () => string;
    }, component: unknown): () => void;
}
/** Minimal browser client context shape this plugin uses. */
interface ClientContext {
    slots: SlotsLike;
    effect(callback: () => () => void, label?: string): void;
}
/** Required service: slots lets the plugin claim the Ventus settings seat. */
export declare const inject: string[];
/** Settings card for Ventus 搜索. */
export declare function VentusSearchSettingsCard(): unknown;
/** Register the settings card into the Ventus settings list seat. */
export declare function apply(ctx: ClientContext): void;
export {};
