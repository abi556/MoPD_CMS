"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TRANSITION_RULES = exports.COMPLAINT_STATUS_GRAPH = void 0;
exports.isValidGraphTransition = isValidGraphTransition;
exports.evaluateTransition = evaluateTransition;
exports.evaluateAssign = evaluateAssign;
exports.listAllowedTransitionTargets = listAllowedTransitionTargets;
exports.canAssignComplaint = canAssignComplaint;
exports.canAdminPickAssignee = canAdminPickAssignee;
exports.canSelfAssignOnly = canSelfAssignOnly;
exports.getAllGraphEdges = getAllGraphEdges;
const complaint_status_enum_1 = require("../enums/complaint-status.enum");
const permission_utils_1 = require("./permission-utils");
exports.COMPLAINT_STATUS_GRAPH = {
    [complaint_status_enum_1.ComplaintStatus.SUBMITTED]: [complaint_status_enum_1.ComplaintStatus.TRIAGE],
    [complaint_status_enum_1.ComplaintStatus.TRIAGE]: [complaint_status_enum_1.ComplaintStatus.ASSIGNED],
    [complaint_status_enum_1.ComplaintStatus.ASSIGNED]: [complaint_status_enum_1.ComplaintStatus.IN_INVESTIGATION],
    [complaint_status_enum_1.ComplaintStatus.IN_INVESTIGATION]: [complaint_status_enum_1.ComplaintStatus.DRAFT_RESPONSE],
    [complaint_status_enum_1.ComplaintStatus.DRAFT_RESPONSE]: [complaint_status_enum_1.ComplaintStatus.QA_LEGAL_REVIEW],
    [complaint_status_enum_1.ComplaintStatus.QA_LEGAL_REVIEW]: [
        complaint_status_enum_1.ComplaintStatus.DRAFT_RESPONSE,
        complaint_status_enum_1.ComplaintStatus.RESPONSE_ISSUED,
    ],
    [complaint_status_enum_1.ComplaintStatus.RESPONSE_ISSUED]: [complaint_status_enum_1.ComplaintStatus.AWAITING_FEEDBACK],
    [complaint_status_enum_1.ComplaintStatus.AWAITING_FEEDBACK]: [
        complaint_status_enum_1.ComplaintStatus.CLOSED,
        complaint_status_enum_1.ComplaintStatus.APPEAL,
    ],
    [complaint_status_enum_1.ComplaintStatus.APPEAL]: [complaint_status_enum_1.ComplaintStatus.ASSIGNED],
    [complaint_status_enum_1.ComplaintStatus.CLOSED]: [],
};
exports.TRANSITION_RULES = [
    {
        from: complaint_status_enum_1.ComplaintStatus.SUBMITTED,
        to: complaint_status_enum_1.ComplaintStatus.TRIAGE,
        alternatives: [{ permissions: ['complaint:triage'] }],
        requiredRoles: ['ComplaintsAdmin'],
    },
    {
        from: complaint_status_enum_1.ComplaintStatus.ASSIGNED,
        to: complaint_status_enum_1.ComplaintStatus.IN_INVESTIGATION,
        alternatives: [{ permissions: ['complaint:investigate'], assigneeOnly: true }],
        requiredRoles: ['CaseOfficer'],
    },
    {
        from: complaint_status_enum_1.ComplaintStatus.IN_INVESTIGATION,
        to: complaint_status_enum_1.ComplaintStatus.DRAFT_RESPONSE,
        alternatives: [{ permissions: ['complaint:investigate'], assigneeOnly: true }],
        requiredRoles: ['CaseOfficer'],
    },
    {
        from: complaint_status_enum_1.ComplaintStatus.DRAFT_RESPONSE,
        to: complaint_status_enum_1.ComplaintStatus.QA_LEGAL_REVIEW,
        alternatives: [{ permissions: ['complaint:investigate'], assigneeOnly: true }],
        requiredRoles: ['CaseOfficer'],
    },
    {
        from: complaint_status_enum_1.ComplaintStatus.QA_LEGAL_REVIEW,
        to: complaint_status_enum_1.ComplaintStatus.DRAFT_RESPONSE,
        alternatives: [{ permissions: ['complaint:review'] }],
        requiredRoles: ['ReviewerApprover'],
    },
    {
        from: complaint_status_enum_1.ComplaintStatus.QA_LEGAL_REVIEW,
        to: complaint_status_enum_1.ComplaintStatus.RESPONSE_ISSUED,
        alternatives: [{ permissions: ['complaint:approve'] }],
        requiredRoles: ['ReviewerApprover'],
    },
    {
        from: complaint_status_enum_1.ComplaintStatus.RESPONSE_ISSUED,
        to: complaint_status_enum_1.ComplaintStatus.AWAITING_FEEDBACK,
        alternatives: [
            { permissions: ['complaint:publish'] },
            { permissions: ['complaint:investigate'], assigneeOnly: true },
        ],
        requiredRoles: ['ComplaintsAdmin', 'CaseOfficer'],
    },
    {
        from: complaint_status_enum_1.ComplaintStatus.AWAITING_FEEDBACK,
        to: complaint_status_enum_1.ComplaintStatus.CLOSED,
        alternatives: [{ permissions: ['complaint:close'] }],
        requiredRoles: ['ComplaintsAdmin'],
    },
    {
        from: complaint_status_enum_1.ComplaintStatus.AWAITING_FEEDBACK,
        to: complaint_status_enum_1.ComplaintStatus.APPEAL,
        alternatives: [{ permissions: ['complaint:escalate'] }],
        requiredRoles: ['ComplaintsAdmin', 'Ombudsperson'],
    },
];
const ASSIGNABLE_STATUSES = [
    complaint_status_enum_1.ComplaintStatus.TRIAGE,
    complaint_status_enum_1.ComplaintStatus.APPEAL,
];
function isSuperAdmin(user) {
    return user.roles.includes('SuperAdmin');
}
function isAssignee(user, complaint) {
    return (complaint.assignedToUserId !== null &&
        complaint.assignedToUserId === user.userId);
}
function getTransitionRule(from, to) {
    return exports.TRANSITION_RULES.find((rule) => rule.from === from && rule.to === to);
}
function alternativePasses(user, complaint, alternative) {
    if (!(0, permission_utils_1.hasAnyWorkflowPermission)(user.permissions, alternative.permissions)) {
        return false;
    }
    if (alternative.assigneeOnly && !(0, permission_utils_1.hasAdminAssignOverride)(user.permissions)) {
        return isAssignee(user, complaint);
    }
    return true;
}
function deny(message, details) {
    return { allowed: false, message, ...details };
}
function isValidGraphTransition(from, to) {
    return exports.COMPLAINT_STATUS_GRAPH[from]?.includes(to) ?? false;
}
function evaluateTransition(user, complaint, from, to) {
    if (isSuperAdmin(user)) {
        return { allowed: true };
    }
    if (!isValidGraphTransition(from, to)) {
        return deny(`Invalid transition from ${from} to ${to}.`, {
            fromStatus: from,
            toStatus: to,
            reasonCode: 'invalid_transition',
        });
    }
    const rule = getTransitionRule(from, to);
    if (!rule) {
        return deny(`No workflow rule for transition from ${from} to ${to}.`, {
            fromStatus: from,
            toStatus: to,
            reasonCode: 'invalid_transition',
        });
    }
    const passes = rule.alternatives.some((alt) => alternativePasses(user, complaint, alt));
    if (passes) {
        return { allowed: true };
    }
    const assigneeBlocked = rule.alternatives.some((alt) => alt.assigneeOnly &&
        (0, permission_utils_1.hasAnyWorkflowPermission)(user.permissions, alt.permissions) &&
        !isAssignee(user, complaint) &&
        !(0, permission_utils_1.hasAdminAssignOverride)(user.permissions));
    if (assigneeBlocked) {
        return deny('This workflow step must be performed by the assigned case officer.', {
            fromStatus: from,
            toStatus: to,
            requiredPermissions: [...rule.alternatives.flatMap((a) => a.permissions)],
            requiredRoles: rule.requiredRoles ? [...rule.requiredRoles] : undefined,
            reasonCode: 'not_assignee',
        });
    }
    return deny(`You are not allowed to transition from ${from} to ${to}.`, {
        fromStatus: from,
        toStatus: to,
        requiredPermissions: [...rule.alternatives.flatMap((a) => a.permissions)],
        requiredRoles: rule.requiredRoles ? [...rule.requiredRoles] : undefined,
        reasonCode: 'missing_permission',
    });
}
function evaluateAssign(user, complaint, assigneeUserId) {
    if (isSuperAdmin(user)) {
        return { allowed: true };
    }
    const status = complaint.status;
    if (!ASSIGNABLE_STATUSES.includes(status)) {
        return deny(`Assignment is not allowed from status ${status}.`, {
            fromStatus: status,
            reasonCode: 'invalid_status',
            requiredPermissions: ['complaint:assign'],
            requiredRoles: ['ComplaintsAdmin'],
        });
    }
    if (status === complaint_status_enum_1.ComplaintStatus.APPEAL) {
        if (!(0, permission_utils_1.hasWorkflowPermission)(user.permissions, 'complaint:assign')) {
            return deny('Reassignment after appeal requires Complaints Admin.', {
                fromStatus: status,
                reasonCode: 'missing_permission',
                requiredPermissions: ['complaint:assign'],
                requiredRoles: ['ComplaintsAdmin'],
            });
        }
        return { allowed: true };
    }
    if ((0, permission_utils_1.hasWorkflowPermission)(user.permissions, 'complaint:assign')) {
        return { allowed: true };
    }
    if ((0, permission_utils_1.hasWorkflowPermission)(user.permissions, 'complaint:assign:self')) {
        if (complaint.assignedToUserId !== null) {
            return deny('This case is already assigned. Contact Complaints Admin to reassign.', {
                fromStatus: status,
                reasonCode: 'already_assigned',
                requiredPermissions: ['complaint:assign'],
                requiredRoles: ['ComplaintsAdmin'],
            });
        }
        if (assigneeUserId !== user.userId) {
            return deny('You may only assign unassigned triage cases to yourself.', {
                fromStatus: status,
                reasonCode: 'self_assign_not_allowed',
                requiredPermissions: ['complaint:assign:self'],
                requiredRoles: ['CaseOfficer'],
            });
        }
        return { allowed: true };
    }
    return deny('You are not allowed to assign complaints.', {
        fromStatus: status,
        reasonCode: 'missing_permission',
        requiredPermissions: ['complaint:assign', 'complaint:assign:self'],
        requiredRoles: ['ComplaintsAdmin', 'CaseOfficer'],
    });
}
function listAllowedTransitionTargets(user, complaint) {
    const from = complaint.status;
    const candidates = exports.COMPLAINT_STATUS_GRAPH[from] ?? [];
    return candidates.filter((to) => {
        if (to === complaint_status_enum_1.ComplaintStatus.ASSIGNED &&
            (from === complaint_status_enum_1.ComplaintStatus.TRIAGE || from === complaint_status_enum_1.ComplaintStatus.APPEAL)) {
            return false;
        }
        if (to === complaint_status_enum_1.ComplaintStatus.APPEAL && from === complaint_status_enum_1.ComplaintStatus.AWAITING_FEEDBACK) {
            return false;
        }
        return evaluateTransition(user, complaint, from, to).allowed;
    });
}
function canAssignComplaint(user, complaint) {
    if (!ASSIGNABLE_STATUSES.includes(complaint.status)) {
        return false;
    }
    if (isSuperAdmin(user)) {
        return true;
    }
    if ((0, permission_utils_1.hasWorkflowPermission)(user.permissions, 'complaint:assign')) {
        return true;
    }
    if (complaint.status === complaint_status_enum_1.ComplaintStatus.TRIAGE &&
        (0, permission_utils_1.hasWorkflowPermission)(user.permissions, 'complaint:assign:self') &&
        complaint.assignedToUserId === null) {
        return true;
    }
    return false;
}
function canAdminPickAssignee(user) {
    if (isSuperAdmin(user)) {
        return true;
    }
    return (0, permission_utils_1.hasWorkflowPermission)(user.permissions, 'complaint:assign');
}
function canSelfAssignOnly(user) {
    if (isSuperAdmin(user) || canAdminPickAssignee(user)) {
        return false;
    }
    return (0, permission_utils_1.hasWorkflowPermission)(user.permissions, 'complaint:assign:self');
}
function getAllGraphEdges() {
    return Object.entries(exports.COMPLAINT_STATUS_GRAPH).flatMap(([from, targets]) => targets.map((to) => ({
        from: from,
        to,
    })));
}
//# sourceMappingURL=complaint-workflow.js.map