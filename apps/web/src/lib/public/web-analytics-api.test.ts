import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/api-client", () => ({
  apiPost: vi.fn(),
}));

import { apiPost } from "@/lib/api-client";
import { sendAnalyticsEvents } from "./web-analytics-api";

describe("web-analytics-api", () => {
  beforeEach(() => {
    vi.mocked(apiPost).mockReset();
  });

  it("posts analytics batch without auth credentials", async () => {
    vi.mocked(apiPost).mockResolvedValue({ recorded: 2 });

    await sendAnalyticsEvents("session-1", [
      { eventType: "page.view", pagePath: "/en", locale: "en" },
      {
        eventType: "funnel.start",
        funnelName: "complaint_submit",
        locale: "en",
      },
    ]);

    expect(apiPost).toHaveBeenCalledWith(
      "/analytics/events",
      {
        sessionId: "session-1",
        events: [
          { eventType: "page.view", pagePath: "/en", locale: "en" },
          {
            eventType: "funnel.start",
            funnelName: "complaint_submit",
            locale: "en",
          },
        ],
      },
      { auth: false },
    );
  });

  it("skips empty batches", async () => {
    await sendAnalyticsEvents("session-1", []);
    expect(apiPost).not.toHaveBeenCalled();
  });
});
