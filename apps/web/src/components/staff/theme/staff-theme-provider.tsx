"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  getSystemDark,
  persistThemePreference,
  readStoredThemePreference,
  resolveStaffTheme,
  cycleThemePreference,
  type StaffResolvedTheme,
  type StaffThemePreference,
} from "@/lib/staff/staff-theme";

interface StaffThemeContextValue {
  preference: StaffThemePreference;
  resolvedTheme: StaffResolvedTheme;
  setPreference: (pref: StaffThemePreference) => void;
  cyclePreference: () => void;
}

export const StaffThemeContext = createContext<StaffThemeContextValue | null>(null);

const themeListeners = new Set<() => void>();

function notifyThemeChange() {
  themeListeners.forEach((listener) => listener());
}

function subscribeToTheme(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  themeListeners.add(onStoreChange);
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", onStoreChange);

  return () => {
    themeListeners.delete(onStoreChange);
    mq.removeEventListener("change", onStoreChange);
  };
}

function getPreferenceSnapshot(): StaffThemePreference {
  return readStoredThemePreference();
}

function getSystemDarkSnapshot(): boolean {
  return getSystemDark();
}

interface StaffThemeProviderProps {
  children: ReactNode;
  /** Server snapshot from theme cookie — keeps SSR and client hydration aligned. */
  initialPreference?: StaffThemePreference;
}

export function StaffThemeProvider({
  children,
  initialPreference = "system",
}: StaffThemeProviderProps) {
  const preference = useSyncExternalStore(
    subscribeToTheme,
    getPreferenceSnapshot,
    () => initialPreference,
  );

  const systemDark = useSyncExternalStore(
    subscribeToTheme,
    getSystemDarkSnapshot,
    () => false,
  );

  // Backfill cookie for users who set theme before cookie sync existed.
  useEffect(() => {
    persistThemePreference(readStoredThemePreference());
  }, []);

  const setPreference = useCallback((pref: StaffThemePreference) => {
    persistThemePreference(pref);
    notifyThemeChange();
  }, []);

  const cyclePreference = useCallback(() => {
    const next = cycleThemePreference(readStoredThemePreference());
    persistThemePreference(next);
    notifyThemeChange();
  }, []);

  const resolvedTheme = resolveStaffTheme(preference, systemDark);

  const value = useMemo(
    () => ({
      preference,
      resolvedTheme,
      setPreference,
      cyclePreference,
    }),
    [preference, resolvedTheme, setPreference, cyclePreference],
  );

  return (
    <StaffThemeContext.Provider value={value}>{children}</StaffThemeContext.Provider>
  );
}

export function useStaffTheme(): StaffThemeContextValue {
  const ctx = useContext(StaffThemeContext);
  if (!ctx) {
    throw new Error("useStaffTheme must be used within StaffThemeProvider");
  }
  return ctx;
}

/** Fallback for AppShell used outside dashboard (e.g. forbidden page). */
export function useStaffThemeOptional(): StaffThemeContextValue {
  const ctx = useContext(StaffThemeContext);
  if (ctx) return ctx;
  return {
    preference: "system",
    resolvedTheme: "light",
    setPreference: () => {},
    cyclePreference: () => {},
  };
}
