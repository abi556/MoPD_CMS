import { describe, expect, it } from "vitest";
import {
  getShortcutDisplayKeys,
  isEditableTarget,
  matchStaffShortcut,
} from "./staff-shortcuts";

function keyEvent(
  partial: Partial<KeyboardEvent> & { key: string },
): KeyboardEvent {
  return {
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    altKey: false,
    defaultPrevented: false,
    target: document.body,
    ...partial,
  } as KeyboardEvent;
}

describe("matchStaffShortcut", () => {
  it("matches Ctrl+K for search", () => {
    expect(matchStaffShortcut(keyEvent({ key: "k", ctrlKey: true }))).toBe(
      "focus-search",
    );
  });

  it("matches Cmd+Shift+C for complaints on Mac", () => {
    expect(
      matchStaffShortcut(keyEvent({ key: "c", metaKey: true, shiftKey: true })),
    ).toBe("go-complaints");
  });

  it("matches Ctrl+Alt+N for notifications on Windows", () => {
    expect(
      matchStaffShortcut(keyEvent({ key: "n", ctrlKey: true, altKey: true })),
    ).toBe("go-notifications");
  });

  it("ignores Ctrl+Shift+N (browser incognito)", () => {
    expect(
      matchStaffShortcut(keyEvent({ key: "n", ctrlKey: true, shiftKey: true })),
    ).toBeNull();
  });

  it("matches ? for help outside inputs", () => {
    expect(matchStaffShortcut(keyEvent({ key: "?" }))).toBe("open-help");
  });

  it("ignores ? while typing in an input", () => {
    const input = document.createElement("input");
    expect(matchStaffShortcut(keyEvent({ key: "?", target: input }))).toBeNull();
  });

  it("matches Ctrl+B for sidebar toggle", () => {
    expect(matchStaffShortcut(keyEvent({ key: "b", ctrlKey: true }))).toBe(
      "toggle-sidebar",
    );
  });
});

describe("isEditableTarget", () => {
  it("detects textarea", () => {
    expect(isEditableTarget(document.createElement("textarea"))).toBe(true);
  });
});

describe("getShortcutDisplayKeys", () => {
  it("uses Ctrl on Windows user agents", () => {
    expect(getShortcutDisplayKeys("focus-search", "Windows NT")).toEqual([
      "Ctrl+K",
    ]);
  });

  it("uses ⌘ on Mac user agents", () => {
    expect(getShortcutDisplayKeys("focus-search", "Macintosh")).toEqual(["⌘+K"]);
  });

  it("shows Alt+N for notifications on Windows", () => {
    expect(getShortcutDisplayKeys("go-notifications", "Windows NT")).toEqual([
      "Ctrl+Alt+N",
    ]);
  });
});
