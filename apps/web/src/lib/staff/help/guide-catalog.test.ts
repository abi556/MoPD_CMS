import { describe, expect, it } from "vitest";
import {
  isStaffGuideSlug,
  staffGuideMessageKey,
  STAFF_GUIDE_SLUGS,
} from "./guide-catalog";

describe("guide-catalog", () => {
  it("maps slugs to message keys", () => {
    expect(staffGuideMessageKey("getting-started")).toBe("gettingStarted");
    expect(staffGuideMessageKey("recovery-inquiries")).toBe("recoveryInquiries");
    expect(staffGuideMessageKey("escalation")).toBe("escalation");
  });

  it("validates guide slugs", () => {
    expect(isStaffGuideSlug("sla")).toBe(true);
    expect(isStaffGuideSlug("invalid")).toBe(false);
    expect(STAFF_GUIDE_SLUGS.length).toBeGreaterThanOrEqual(7);
  });
});
