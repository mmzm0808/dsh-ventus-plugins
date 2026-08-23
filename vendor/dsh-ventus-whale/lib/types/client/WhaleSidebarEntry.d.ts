/**
 * The sidebar foot summon toggle: 召唤/隐藏 the whale pet from anywhere in the
 * GUI (t8: 隐藏功能并入此按钮，工具栏不再有独立隐藏). Registered into the
 * 'sidebar.footer.action' list seat; the shell passes only `{ wide }` (no
 * store, no injected business surface — see ui-sidebar's
 * SidebarFooterActionOwnerProps).
 */
import { type ReactNode } from 'react';
/** Owner share: the sidebar passes only its column state. */
export interface WhaleSidebarEntryProps {
    /** Whether the sidebar renders wide content (false = 56px rail). */
    wide: boolean;
}
/**
 * Render the whale summon toggle at the sidebar foot.
 * @param props - the sidebar column state.
 * @returns the toggle button.
 */
export declare function WhaleSidebarEntry({ wide }: WhaleSidebarEntryProps): ReactNode;
