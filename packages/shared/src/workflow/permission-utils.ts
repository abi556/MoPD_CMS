/** Workflow permission aliases (canonical SDS codes ↔ legacy runtime codes). */
export const WORKFLOW_PERMISSION_ALIASES: Readonly<
  Record<string, readonly string[]>
> = {
  'complaint:assign': ['complaints:assign'],
  'complaint:read': [
    'complaints:list',
    'complaints:detail',
    'complaints:history',
    'complaint:read:own',
  ],
  'workflow:transition': ['complaints:transition', 'complaints:assign'],
};

export function satisfiesWorkflowPermission(
  granted: readonly string[],
  required: string,
): boolean {
  if (granted.includes(required)) {
    return true;
  }
  for (const [canonical, legacyCodes] of Object.entries(
    WORKFLOW_PERMISSION_ALIASES,
  )) {
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

export function hasWorkflowPermission(
  granted: readonly string[],
  required: string,
): boolean {
  return satisfiesWorkflowPermission(granted, required);
}

export function hasAnyWorkflowPermission(
  granted: readonly string[],
  required: readonly string[],
): boolean {
  return required.some((code) => satisfiesWorkflowPermission(granted, code));
}

export function hasAdminAssignOverride(granted: readonly string[]): boolean {
  return hasWorkflowPermission(granted, 'complaint:assign');
}
