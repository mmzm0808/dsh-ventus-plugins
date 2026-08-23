import type { ApprovalRequest, ApprovalOutcome } from '@deepseek-ai/dsh-user-approval';
import type { ToolExecution } from '@deepseek-ai/dsh-tools';
import type { SandboxEscalationRequest } from './policy.js';
/**
 * Exact bridge from an Auto classifier allow to the official approval seam.
 * A grant is scoped to the same live Agent, tool name, call id, requested mode,
 * and justification. It is consumed once and never changes session policy.
 */
export declare class AutoApprovalGrants {
    private readonly byAgent;
    plan(exec: Readonly<ToolExecution>, request: SandboxEscalationRequest): void;
    /** Consume an exact planned grant, or leave unrelated approval requests untouched. */
    decide(request: ApprovalRequest): ApprovalOutcome | undefined;
    /** Drop an unused grant when the tool settles before reaching the approval seam. */
    settle(exec: Readonly<ToolExecution>): void;
}
//# sourceMappingURL=escalation.d.ts.map