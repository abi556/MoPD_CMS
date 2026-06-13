/** Client-side permission checks (mirror server SDS + legacy aliases). */

const PERMISSION_ALIASES: Record<string, readonly string[]> = {
  "complaint:read": ["complaints:list", "complaints:detail", "complaints:history", "complaint:read:own"],
  "workflow:transition": ["complaints:transition", "complaints:assign"],
  "template:manage": ["config:manage"],
  "notification:manage": ["config:manage"],
  "sla:configure": ["config:manage"],
};

export function satisfiesPermission(
  granted: readonly string[],
  required: string,
): boolean {
  if (granted.includes(required)) {
    return true;
  }
  for (const [canonical, legacyCodes] of Object.entries(PERMISSION_ALIASES)) {
    if (canonical === required && legacyCodes.some((c) => granted.includes(c))) {
      return true;
    }
    if (legacyCodes.includes(required) && granted.includes(canonical)) {
      return true;
    }
  }
  return false;
}

export function hasPermission(
  permissions: readonly string[] | undefined,
  code: string,
): boolean {
  if (!permissions?.length) {
    return false;
  }
  return satisfiesPermission(permissions, code);
}

/** Nav visibility — granted codes only, no alias expansion. */
export function hasExactPermission(
  permissions: readonly string[] | undefined,
  code: string,
): boolean {
  return Boolean(permissions?.includes(code));
}

export function hasAllPermissions(
  permissions: readonly string[] | undefined,
  required: readonly string[],
): boolean {
  if (!required.length) {
    return true;
  }
  if (!permissions?.length) {
    return false;
  }
  return required.every((code) => satisfiesPermission(permissions, code));
}

export function hasAnyPermission(
  permissions: readonly string[] | undefined,
  required: readonly string[],
): boolean {
  if (!required.length) {
    return true;
  }
  if (!permissions?.length) {
    return false;
  }
  return required.some((code) => satisfiesPermission(permissions, code));
}

export function canUploadDocuments(permissions: readonly string[]): boolean {
  return (
    hasPermission(permissions, "document:upload") &&
    (hasPermission(permissions, "complaint:read") ||
      hasPermission(permissions, "complaint:read:own"))
  );
}
