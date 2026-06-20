import { describe, expect, it } from "vitest";
import {
  formatUnreadBadgeCount,
  groupNotificationsByDate,
  inboxDateGroup,
  normalizeInboxMessageParams,
} from "./inbox-notifications";
import type { InAppNotificationItem } from "./in-app-notifications-api";

function item(createdAt: string): InAppNotificationItem {
  return {
    id: "n1",
    type: "complaint_assigned",
    severity: "info",
    messageKey: "inbox.types.complaintAssigned",
    messageParams: { reference: "CMP-1" },
    link: null,
    entityType: null,
    entityId: null,
    readAt: null,
    createdAt,
  };
}

describe("inboxDateGroup", () => {
  const now = new Date("2026-06-18T15:00:00.000Z");

  it("classifies today", () => {
    expect(inboxDateGroup("2026-06-18T10:00:00.000Z", now)).toBe("today");
  });

  it("classifies yesterday", () => {
    expect(inboxDateGroup("2026-06-17T10:00:00.000Z", now)).toBe("yesterday");
  });

  it("classifies earlier", () => {
    expect(inboxDateGroup("2026-06-10T10:00:00.000Z", now)).toBe("earlier");
  });
});

describe("groupNotificationsByDate", () => {
  it("groups items in stable order", () => {
    const groups = groupNotificationsByDate(
      [
        item("2026-06-10T10:00:00.000Z"),
        item("2026-06-18T10:00:00.000Z"),
        item("2026-06-17T10:00:00.000Z"),
      ],
      new Date("2026-06-18T15:00:00.000Z"),
    );
    expect(groups.map((g) => g.group)).toEqual(["today", "yesterday", "earlier"]);
  });
});

describe("formatUnreadBadgeCount", () => {
  it("caps at 99+", () => {
    expect(formatUnreadBadgeCount(120)).toBe("99+");
    expect(formatUnreadBadgeCount(3)).toBe("3");
  });
});

describe("normalizeInboxMessageParams", () => {
  it("maps referenceNo alias to reference", () => {
    expect(
      normalizeInboxMessageParams("complaintAssigned", {
        referenceNo: "CMS-TEST-001",
      }),
    ).toEqual({ referenceNo: "CMS-TEST-001", reference: "CMS-TEST-001" });
  });

  it("fills missing required params with safe fallbacks", () => {
    expect(normalizeInboxMessageParams("complaintAssigned", {})).toEqual({
      reference: "—",
    });
    expect(normalizeInboxMessageParams("slaWarning", { reference: "CMP-1" })).toEqual({
      reference: "CMP-1",
      thresholdPct: 0,
    });
  });
});
