/**
 * dsh-ventus-whale — host half. Mounts the /api/ventus-whale route family and
 * a settings section (namespace `ventus-whale`) so the web settings surface
 * can edit the pet's scale, sensitivity, caption, and placement. The browser
 * half (./client) renders the interactive 3D whale.
 */
import type { Context } from '@deepseek-ai/cordis';
import z from 'schemastery';
import { DEFAULT_CONFIG } from './protocol.ts';
/** Stable cordis plugin name (matches cordis.patch.yml insert id). */
export declare const name = "ventus-whale";
/** Services required before the routes can mount. */
export declare const inject: string[];
/** Settings namespace the web settings surface edits. */
export declare const WHALE_SETTINGS_NAMESPACE = "ventus-whale";
/** Settings section schema: the fields the settings surface edits. */
export declare const WHALE_SETTINGS_SCHEMA: z<Schemastery.ObjectS<{
    enabled: z<boolean, boolean>;
    flipOnSend: z<boolean, boolean>;
    scale: z<number, number>;
    sensitivity: z<number, number>;
    caption: z<string, string>;
}>, Schemastery.ObjectT<{
    enabled: z<boolean, boolean>;
    flipOnSend: z<boolean, boolean>;
    scale: z<number, number>;
    sensitivity: z<number, number>;
    caption: z<string, string>;
}>>;
/** Plugin config (subset of the settings section). */
export interface WhalePluginConfig {
    /** Master switch. */
    enabled?: boolean;
}
export declare const Config: z<WhalePluginConfig>;
/** Register the whale host surfaces. */
export declare function apply(ctx: Context, config?: WhalePluginConfig): void;
export { DEFAULT_CONFIG };
