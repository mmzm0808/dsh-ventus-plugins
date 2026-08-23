import type { Context } from '../context-types.ts';
import { type SessionScope } from './api.ts';
import { type SidebarStore, type SidebarTab } from './state.ts';
export declare function EditorHost(props: {
    ctx: Context;
    store: SidebarStore;
    scope: SessionScope;
    tab: SidebarTab;
    expanded: string[];
    onToggleDir: (path: string) => void;
    onReferenceFile: (path: string) => void;
    /** The pane's active file path — the tree highlights + scrolls to its row. */
    revealPath?: string;
    /** Monotonic reveal counter — bumps force the tree to re-scroll. */
    revealSeq?: number;
}): import("react").JSX.Element;
