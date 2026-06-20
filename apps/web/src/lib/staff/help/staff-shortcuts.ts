export const STAFF_FOCUS_SEARCH_EVENT = "staff:focus-search";

export type StaffShortcutId =
  | "focus-search"
  | "open-help"
  | "go-dashboard"
  | "go-complaints"
  | "go-notifications"
  | "toggle-sidebar";

export interface StaffShortcutDefinition {
  id: StaffShortcutId;
  /** i18n key under help.shortcuts */
  labelKey: string;
  group: "general" | "navigation";
  requiresComplaintRead?: boolean;
}

export const STAFF_SHORTCUTS: StaffShortcutDefinition[] = [
  {
    id: "focus-search",
    labelKey: "focusSearch",
    group: "general",
    requiresComplaintRead: true,
  },
  {
    id: "open-help",
    labelKey: "openHelp",
    group: "general",
  },
  {
    id: "toggle-sidebar",
    labelKey: "toggleSidebar",
    group: "general",
  },
  {
    id: "go-dashboard",
    labelKey: "goDashboard",
    group: "navigation",
  },
  {
    id: "go-complaints",
    labelKey: "goComplaints",
    group: "navigation",
    requiresComplaintRead: true,
  },
  {
    id: "go-notifications",
    labelKey: "goNotifications",
    group: "navigation",
  },
];

export function isMacPlatform(userAgent = ""): boolean {
  return /Mac|iPhone|iPad/i.test(userAgent);
}

export function shortcutModifierLabel(userAgent = ""): string {
  return isMacPlatform(userAgent) ? "⌘" : "Ctrl";
}

export function shortcutAltLabel(userAgent = ""): string {
  return isMacPlatform(userAgent) ? "Option" : "Alt";
}

export function getShortcutDisplayKeys(
  id: StaffShortcutId,
  userAgent = "",
): string[] {
  const mod = shortcutModifierLabel(userAgent);
  const alt = shortcutAltLabel(userAgent);
  switch (id) {
    case "focus-search":
      return [`${mod}+K`];
    case "open-help":
      return ["?"];
    case "toggle-sidebar":
      return [`${mod}+B`];
    case "go-dashboard":
      return [`${mod}+Shift+D`];
    case "go-complaints":
      return [`${mod}+Shift+C`];
    case "go-notifications":
      return [`${mod}+${alt}+N`];
    default:
      return [];
  }
}

export function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") {
    return true;
  }
  if (target.isContentEditable) {
    return true;
  }
  return Boolean(target.closest("[contenteditable='true']"));
}

function hasMod(event: Pick<KeyboardEvent, "ctrlKey" | "metaKey">): boolean {
  return event.ctrlKey || event.metaKey;
}

function normalizedKey(event: Pick<KeyboardEvent, "key">): string {
  return event.key.length === 1 ? event.key.toLowerCase() : event.key;
}

/** Pure matcher for unit tests and the global listener. */
export function matchStaffShortcut(
  event: Pick<
    KeyboardEvent,
    "key" | "ctrlKey" | "metaKey" | "shiftKey" | "altKey" | "target" | "defaultPrevented"
  >,
): StaffShortcutId | null {
  if (event.defaultPrevented) {
    return null;
  }

  const key = normalizedKey(event);
  const mod = hasMod(event);
  const inField = isEditableTarget(event.target);

  if (mod && event.shiftKey && key === "d") {
    return "go-dashboard";
  }
  if (mod && event.shiftKey && key === "c") {
    return "go-complaints";
  }
  if (mod && event.altKey && !event.shiftKey && key === "n") {
    return "go-notifications";
  }
  if (mod && !event.shiftKey && !event.altKey && key === "k") {
    return "focus-search";
  }
  if (mod && !event.shiftKey && !event.altKey && key === "b") {
    return "toggle-sidebar";
  }

  if (!mod && !event.altKey && event.key === "?" && !inField) {
    return "open-help";
  }

  return null;
}

export function dispatchFocusStaffSearch(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(STAFF_FOCUS_SEARCH_EVENT));
  }
}
