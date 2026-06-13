import { describe, expect, it } from "vitest";
import {
  formatVariableHint,
  getTemplateVariableHints,
  TEMPLATE_VARIABLE_HINTS,
} from "./template-variables";

describe("template-variables", () => {
  it("returns hints for known template keys", () => {
    expect(getTemplateVariableHints("password_reset")).toContain("resetUrl");
    expect(getTemplateVariableHints("complaint_submitted_ack")).toContain("referenceNo");
  });

  it("returns empty array for unknown keys", () => {
    expect(getTemplateVariableHints("unknown_key")).toEqual([]);
  });

  it("formats variable as mustache", () => {
    expect(formatVariableHint("trackUrl")).toBe("{{trackUrl}}");
  });

  it("covers all seeded template keys", () => {
    const keys = [
      "password_reset",
      "complaint_submitted_ack",
      "complaint_transition",
      "complaint_recovery_otp",
    ];
    for (const key of keys) {
      expect(TEMPLATE_VARIABLE_HINTS[key]?.length).toBeGreaterThan(0);
    }
  });
});
