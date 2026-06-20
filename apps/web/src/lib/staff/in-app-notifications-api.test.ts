import { describe, expect, it } from "vitest";
import {
  buildInAppNotificationsQuery,
  extractUnreadCount,
} from "./in-app-notifications-api";

describe("buildInAppNotificationsQuery", () => {
  it("builds unread-only pagination query", () => {
    expect(
      buildInAppNotificationsQuery({ page: 2, pageSize: 10, unreadOnly: true }),
    ).toBe("?page=2&pageSize=10&unreadOnly=true");
  });

  it("returns empty string when no params", () => {
    expect(buildInAppNotificationsQuery({})).toBe("");
  });
});

describe("extractUnreadCount", () => {
  it("reads count from unwrapped payload", () => {
    expect(extractUnreadCount({ count: 3 })).toBe(3);
  });

  it("reads count from enveloped payload", () => {
    expect(extractUnreadCount({ data: { count: 1 } })).toBe(1);
  });

  it("returns 0 for invalid payload", () => {
    expect(extractUnreadCount({})).toBe(0);
    expect(extractUnreadCount(null)).toBe(0);
  });
});
