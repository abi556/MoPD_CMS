import { ComplaintStatus } from '../enums/complaint-status.enum';
export type WorkflowReasonCode = 'missing_permission' | 'not_assignee' | 'self_assign_not_allowed' | 'already_assigned' | 'invalid_status' | 'invalid_transition';
export interface WorkflowUserContext {
    userId: string;
    roles: readonly string[];
    permissions: readonly string[];
}
export interface ComplaintWorkflowContext {
    status: ComplaintStatus;
    assignedToUserId: string | null;
}
export interface WorkflowDenialDetails {
    fromStatus: ComplaintStatus;
    toStatus?: ComplaintStatus;
    requiredPermissions?: string[];
    requiredRoles?: string[];
    reasonCode: WorkflowReasonCode;
}
export type WorkflowDecision = {
    allowed: true;
} | ({
    allowed: false;
    message: string;
} & WorkflowDenialDetails);
interface PermissionAlternative {
    permissions: readonly string[];
    assigneeOnly?: boolean;
}
interface TransitionRule {
    from: ComplaintStatus;
    to: ComplaintStatus;
    alternatives: readonly PermissionAlternative[];
    requiredRoles?: readonly string[];
}
export declare const COMPLAINT_STATUS_GRAPH: Record<ComplaintStatus, readonly ComplaintStatus[]>;
export declare const TRANSITION_RULES: readonly TransitionRule[];
export declare function isValidGraphTransition(from: ComplaintStatus, to: ComplaintStatus): boolean;
export declare function evaluateTransition(user: WorkflowUserContext, complaint: ComplaintWorkflowContext, from: ComplaintStatus, to: ComplaintStatus): WorkflowDecision;
export declare function evaluateAssign(user: WorkflowUserContext, complaint: ComplaintWorkflowContext, assigneeUserId: string): WorkflowDecision;
export declare function listAllowedTransitionTargets(user: WorkflowUserContext, complaint: ComplaintWorkflowContext): ComplaintStatus[];
export declare function canAssignComplaint(user: WorkflowUserContext, complaint: ComplaintWorkflowContext): boolean;
export declare function canAdminPickAssignee(user: WorkflowUserContext): boolean;
export declare function canSelfAssignOnly(user: WorkflowUserContext): boolean;
export declare function getAllGraphEdges(): Array<{
    from: ComplaintStatus;
    to: ComplaintStatus;
}>;
export {};
