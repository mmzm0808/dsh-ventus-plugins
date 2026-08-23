/** Root label: the last path segment (mirror of the host rootLabel). */
export declare function baseName(path: string): string;
export declare function FileTree(props: {
    sessionId: string;
    cwd: string | undefined;
    expanded: string[];
    onToggle: (path: string) => void;
    onOpenFile: (path: string) => void;
    /** Context-menu "open in a new tab" (file rows; absent → no entry). */
    onOpenFileNewTab?: (path: string) => void;
    /** Context-menu "open to the side" (file rows; absent → no entry). */
    onOpenFileSide?: (path: string) => void;
    /** Insert `@<relative path>` into the composer draft. */
    onReferenceFile: (path: string) => void;
    /** Bump to wipe the level cache and reload the visible set. */
    refreshTick: number;
    /** The pane's active file path: its row highlights and scrolls into view
     *  once its ancestor levels load (VSCode-style reveal on tab activation). */
    selectedPath?: string;
    /** Monotonic reveal counter — every bump re-scrolls to the revealed row. */
    revealSeq?: number;
}): import("react").JSX.Element;
