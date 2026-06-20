"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import { useRouter } from "@/i18n/navigation";
import { useSession } from "@/components/providers/auth-provider";
import { useSidebar } from "@/components/staff/layout/sidebar-context";
import { hasPermission } from "@/lib/permissions";
import { staffRoutes } from "@/lib/staff/routes";
import {
  dispatchFocusStaffSearch,
  matchStaffShortcut,
  STAFF_SHORTCUTS,
  type StaffShortcutId,
} from "@/lib/staff/help/staff-shortcuts";

interface StaffKeyboardShortcutsContextValue {
  runShortcut: (id: StaffShortcutId) => void;
  canRunShortcut: (id: StaffShortcutId) => boolean;
}

const StaffKeyboardShortcutsContext =
  createContext<StaffKeyboardShortcutsContextValue | null>(null);

export function StaffKeyboardShortcutsProvider({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const { user } = useSession();
  const { toggleCollapsed, toggle } = useSidebar();

  const canRunShortcut = useCallback(
    (id: StaffShortcutId) => {
      const def = STAFF_SHORTCUTS.find((item) => item.id === id);
      if (!def) {
        return false;
      }
      if (!def.requiresComplaintRead) {
        return true;
      }
      if (!user) {
        return false;
      }
      return (
        hasPermission(user.permissions, "complaint:read") ||
        hasPermission(user.permissions, "complaint:read:own")
      );
    },
    [user],
  );

  const runShortcut = useCallback(
    (id: StaffShortcutId) => {
      if (!canRunShortcut(id)) {
        return;
      }

      switch (id) {
        case "focus-search":
          dispatchFocusStaffSearch();
          break;
        case "open-help":
          router.push(staffRoutes.help);
          break;
        case "go-dashboard":
          router.push(staffRoutes.home);
          break;
        case "go-complaints":
          router.push(staffRoutes.complaints);
          break;
        case "go-notifications":
          router.push(staffRoutes.notifications);
          break;
        case "toggle-sidebar":
          if (typeof window !== "undefined" && window.innerWidth < 768) {
            toggle();
          } else {
            toggleCollapsed();
          }
          break;
        default:
          break;
      }
    },
    [canRunShortcut, router, toggle, toggleCollapsed],
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const id = matchStaffShortcut(event);
      if (!id || !canRunShortcut(id)) {
        return;
      }
      event.preventDefault();
      runShortcut(id);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [canRunShortcut, runShortcut]);

  const value = useMemo(
    () => ({ runShortcut, canRunShortcut }),
    [runShortcut, canRunShortcut],
  );

  return (
    <StaffKeyboardShortcutsContext.Provider value={value}>
      {children}
    </StaffKeyboardShortcutsContext.Provider>
  );
}

export function useStaffKeyboardShortcuts() {
  const ctx = useContext(StaffKeyboardShortcutsContext);
  if (!ctx) {
    throw new Error(
      "useStaffKeyboardShortcuts must be used within StaffKeyboardShortcutsProvider",
    );
  }
  return ctx;
}
