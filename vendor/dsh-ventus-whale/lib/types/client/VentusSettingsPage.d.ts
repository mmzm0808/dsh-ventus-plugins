/**
 * The Ventus settings page (a `settings.section` named "Ventus"). Renders the
 * Ventus-series plugin cards contributed into the shared `ventus.settings.item`
 * slot, so any Ventus plugin can auto-create the page (when it is the first to
 * mount) or merge its card into the existing page.
 */
import type { ReactNode } from 'react';
import type { PropsRenderSlots } from '@deepseek-ai/dsh-client-ui-slots';
/** Props the Ventus settings page binds. */
export interface VentusSettingsPageProps {
    /** Runtime slot rendering for the Ventus series plugin cards. */
    renderSlot: PropsRenderSlots<'ventus.settings.item'>['renderSlot'];
}
/**
 * Render the Ventus settings page: one stacked card per Ventus-series plugin.
 * @param props - the child slot renderer.
 * @returns the page body.
 */
export declare function VentusSettingsPage(props: VentusSettingsPageProps): ReactNode;
