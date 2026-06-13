export type StaffThemePreference = "system" | "light" | "dark";
export type StaffResolvedTheme = "light" | "dark";

export const STAFF_THEME_STORAGE_KEY = "mopd-staff-theme";
export const STAFF_THEME_COOKIE_KEY = "mopd-staff-theme";

const THEME_PREFERENCES = new Set<StaffThemePreference>(["system", "light", "dark"]);

export function isStaffThemePreference(value: string): value is StaffThemePreference {
  return THEME_PREFERENCES.has(value as StaffThemePreference);
}

export function parseThemePreference(value: string | undefined | null): StaffThemePreference {
  if (value && isStaffThemePreference(value)) {
    return value;
  }
  return "system";
}

export function resolveStaffTheme(
  preference: StaffThemePreference,
  systemDark: boolean,
): StaffResolvedTheme {
  if (preference === "light") return "light";
  if (preference === "dark") return "dark";
  return systemDark ? "dark" : "light";
}

export function readStoredThemePreference(): StaffThemePreference {
  if (typeof window === "undefined") return "system";
  try {
    const stored = localStorage.getItem(STAFF_THEME_STORAGE_KEY);
    return parseThemePreference(stored);
  } catch {
    /* ignore */
  }
  return "system";
}

export function persistThemePreference(preference: StaffThemePreference): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STAFF_THEME_STORAGE_KEY, preference);
    document.cookie = `${STAFF_THEME_COOKIE_KEY}=${preference};path=/;max-age=31536000;samesite=lax`;
  } catch {
    /* ignore */
  }
}

export function cycleThemePreference(
  current: StaffThemePreference,
): StaffThemePreference {
  if (current === "system") return "light";
  if (current === "light") return "dark";
  return "system";
}

export function getSystemDark(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}
