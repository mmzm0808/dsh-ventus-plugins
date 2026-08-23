/**
 * The whale pet settings card: enabled, flip-on-send, scale, sensitivity,
 * caption, and bottom offset. Reads the shared config cache (t9: prefetched
 * at plugin activation, so the card renders immediately when the settings
 * dialog opens — the same data-ready-before-mount timing the web-ui family
 * cards get from their settings bridge), and writes through the host API so
 * the pet's full config (including the free x/y position) stays intact.
 * Registered into the `ventus.plugin.item` child slot the Ventus group
 * card declares.
 *
 * t12: 设置不再自动保存——所有控件只写入本地草稿（draft），点「保存」一次性
 * 提交到 host API 并广播，「取消」丢弃草稿回到已保存值。虎鲸自身的交互
 * （拖拽定位、悬停改名）仍即时持久化，不受本卡保存语义影响。
 */
import { type ReactNode } from 'react';
import { type WhaleApi } from './WhalePet.tsx';
/** Props the settings card binds. */
export interface WhaleSettingsCardProps {
    /** The host API (tests inject a fake). */
    api?: WhaleApi;
}
/**
 * Render the whale pet settings card.
 * @param props - api client.
 * @returns the card, or nothing when the API is unreachable.
 */
export declare function WhaleSettingsCard({ api }: WhaleSettingsCardProps): ReactNode;
