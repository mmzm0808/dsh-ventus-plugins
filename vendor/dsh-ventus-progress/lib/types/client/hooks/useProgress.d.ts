import type { ProgressListEntry } from '../../shared/progress-types.js';
export declare function useProgress(): {
    entries: ProgressListEntry[];
    loading: boolean;
    refresh: () => void;
};
