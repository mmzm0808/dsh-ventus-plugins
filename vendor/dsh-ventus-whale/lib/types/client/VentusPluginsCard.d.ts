/**
 * The Ventus plugin group card. Renders as one item in the
 * `settings.plugin.item` list (sibling of the Web UI Plugins group) and,
 * when expanded, renders the Ventus series plugin cards into its own child
 * slot `ventus.plugin.item`.
 */
import { type ReactNode } from 'react';
import type { PropsRenderSlots } from '@deepseek-ai/dsh-client-ui-slots';
/** Owner share of the group card (the section supplies nothing). */
export interface VentusPluginItemOwnerProps {
    /** Marker field: card owner props are intentionally empty. */
    children?: never;
}
/** Props the group card binds. */
export interface VentusPluginsCardProps {
    /** Runtime slot rendering for the series plugin cards. */
    renderSlot: PropsRenderSlots<'ventus.plugin.item'>['renderSlot'];
}
/**
 * Render the group card with the child plugin cards inside its body.
 * @param props - the child slot renderer.
 * @returns the group card.
 */
export declare function VentusPluginsCard(props: VentusPluginsCardProps): ReactNode;
