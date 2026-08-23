/**
 * The Ventus whale pet: a transparent floating 3D whale in the corner of the
 * web GUI. Interactions:
 * - left drag: rotate the whale in place (arcball, with release momentum);
 * - right drag (or the hover toolbar's 拖动 button, touch-friendly):
 *   freely reposition the whale anywhere in the viewport (persisted as x/y;
 *   any settings save keeps the position); the button toggles move mode and
 *   pointer events unify mouse/touch (touch-action: none while dragging);
 * - drag (left or right): hearts keep bursting while the pointer moves,
 *   throttled to ~5 bursts/s, so the whole gesture showers hearts;
 * - single click: a burst of 3–5 hearts floats up from the head crown
 *   (sprite hearts follow the whale's rotation); right click bursts too;
 * - double click: the whale jumps;
 * - hover: a two-row toolbar appears (改名 / 重置 / 拖动 / 爱心开关 / 转圈);
 *   on touch devices a tap on the whale toggles the toolbar; 改名 edits the
 *   caption inline; 转圈 triggers a 360° front somersault on demand. The
 *   caption is hidden by default.
 * - summon/hide is the sidebar 🐋 toggle (t8): no independent hide control.
 * - default: disabled (t10), summoned at the right-middle of the viewport.
 * Config (scale / sensitivity / caption / x / y) rides the
 * host /api/ventus-whale endpoints; every accepted update is broadcast on
 * WHALE_CONFIG_EVENT so the settings card stays in sync.
 */
import { type ReactPortal } from 'react';
import type { WhaleConfig } from '../protocol.ts';
/** Host API patch: x/y accept null to clear the free position. */
export type WhalePatch = Partial<Omit<WhaleConfig, 'x' | 'y'>> & {
    x?: number | null;
    y?: number | null;
};
/** The host API surface. */
export interface WhaleApi {
    state(): Promise<{
        config: WhaleConfig;
    }>;
    update(patch: WhalePatch): Promise<{
        config: WhaleConfig;
    }>;
}
/** Default host API (same-origin). */
export declare const whaleApi: WhaleApi;
/** Cross-component config sync event (pet <-> settings card). */
export declare const WHALE_CONFIG_EVENT = "ventus-whale:config";
/** t15: 设置卡草稿实时预览事件——只同步 pet 渲染，不视为已保存配置。 */
export declare const WHALE_PREVIEW_EVENT = "ventus-whale:preview";
/** Props for the whale pet. */
export interface WhalePetProps {
    /** The host API. */
    api?: WhaleApi;
}
/**
 * The floating 3D whale pet.
 * @param props - api client.
 */
export declare function WhalePet({ api }: WhalePetProps): ReactPortal | null;
