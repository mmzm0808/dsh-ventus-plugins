import type { ToolExecution, ToolExecutionResult } from '@deepseek-ai/dsh-tools';
import { type PolicyRoots } from './paths.js';
/** In-memory provenance for exact paths created successfully during the live session. */
export declare class ArtifactRegistry {
    private readonly created;
    private readonly pending;
    private readonly pendingShellDiscovery;
    /** Whether a path was observed as created in this exact live session. */
    has(owner: object | undefined, path: string, roots: PolicyRoots): boolean;
    /**
     * Whether every object in a recursively deleted tree is still an observed
     * Session artifact. This prevents an old file moved into a new directory
     * from inheriting the directory's automatic-cleanup authority.
     */
    hasTree(owner: object | undefined, path: string, roots: PolicyRoots): boolean;
    /** Record planned exact creations for settlement-time promotion. */
    plan(exec: ToolExecution, paths: readonly string[], roots: PolicyRoots): void;
    /**
     * Observe a normal shell call so files created by arbitrary project tools or
     * scaffolders can be distinguished from data that existed before the call.
     */
    discoverShellCreates(exec: ToolExecution, roots: PolicyRoots): void;
    /** Promote successful creates and forget every pending execution. */
    settle(exec: ToolExecution, result: ToolExecutionResult, roots: PolicyRoots): void;
    private add;
}
//# sourceMappingURL=artifacts.d.ts.map