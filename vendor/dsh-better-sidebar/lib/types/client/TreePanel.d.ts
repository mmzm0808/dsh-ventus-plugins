export declare function TreePanel(props: {
    sessionId: string;
    cwd: string | undefined;
    expanded: string[];
    onToggle: (path: string) => void;
    onOpenFile: (path: string) => void;
    /** File context-menu "open in a new tab" (passed through to FileTree). */
    onOpenFileNewTab?: (path: string) => void;
    /** File context-menu "open to the side" (passed through to FileTree). */
    onOpenFileSide?: (path: string) => void;
    onReferenceFile: (path: string) => void;
    /** Full-window presentation: the panel fills its host instead of docking
     *  at a fixed width. */
    full?: boolean;
    /** The pane's active file path — the tree highlights + scrolls to its row. */
    revealPath?: string;
    /** Monotonic reveal counter — bumps force the tree to re-scroll. */
    revealSeq?: number;
}): import("react").JSX.Element;
