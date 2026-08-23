/**
 * Browser-half entry for dsh-ventus-whale — runs inside the dsh web GUI.
 *
 * Mounts:
 *  1. the floating 3D whale pet (body portal — no corner slot exists);
 *  2. the "Ventus 插件" group card into the settings plugin list, plus the
 *     whale settings card into its child slot.
 *
 * Failure policy: DOM mounting problems are logged, never thrown — an
 * external plugin must not take the GUI down.
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client';
declare module '@deepseek-ai/dsh-client-ui-slots' {
    interface SlotMap {
        /**
         * The child slot one Ventus family plugin settings card registers into,
         * rendered by the "Ventus" settings section page.
         */
        'ventus.settings.item': {
            kind: 'list';
            scope: 'root';
            owner: VentusSettingsItemOwnerProps;
        };
    }
}
/** Owner share of one Ventus settings card (the page supplies nothing). */
export interface VentusSettingsItemOwnerProps {
    /** Marker field: card owner props are intentionally empty. */
    children?: never;
}
/** Required services. */
export declare const inject: string[];
/** Mount the whale pet + Ventus settings group. */
export declare function apply(ctx: ClientContext): void;
