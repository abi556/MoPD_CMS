"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WORKFLOW_PERMISSION_ALIASES = void 0;
exports.satisfiesWorkflowPermission = satisfiesWorkflowPermission;
exports.hasWorkflowPermission = hasWorkflowPermission;
exports.hasAnyWorkflowPermission = hasAnyWorkflowPermission;
exports.hasAdminAssignOverride = hasAdminAssignOverride;
exports.WORKFLOW_PERMISSION_ALIASES = {
    'complaint:assign': ['complaints:assign'],
    'complaint:read': [
        'complaints:list',
        'complaints:detail',
        'complaints:history',
        'complaint:read:own',
    ],
    'workflow:transition': ['complaints:transition', 'complaints:assign'],
};
function satisfiesWorkflowPermission(granted, required) {
    if (granted.includes(required)) {
        return true;
    }
    for (const [canonical, legacyCodes] of Object.entries(exports.WORKFLOW_PERMISSION_ALIASES)) {
        if (canonical === required) {
            if (legacyCodes.some((code) => granted.includes(code))) {
                return true;
            }
        }
        if (legacyCodes.includes(required) && granted.includes(canonical)) {
            return true;
        }
    }
    return false;
}
function hasWorkflowPermission(granted, required) {
    return satisfiesWorkflowPermission(granted, required);
}
function hasAnyWorkflowPermission(granted, required) {
    return required.some((code) => satisfiesWorkflowPermission(granted, code));
}
function hasAdminAssignOverride(granted) {
    return hasWorkflowPermission(granted, 'complaint:assign');
}
//# sourceMappingURL=permission-utils.js.map