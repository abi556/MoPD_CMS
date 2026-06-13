import { describe, expect, it } from "vitest";
import { getSlaTone, getStatusTone } from "./status-badge";

describe("StatusBadge tones", () => {
  it("maps triage to warning", () => {
    expect(getStatusTone("TRIAGE")).toBe("warning");
  });

  it("maps closed to neutral", () => {
    expect(getStatusTone("CLOSED")).toBe("neutral");
  });

  it("maps SLA at_risk to warning", () => {
    expect(getSlaTone("at_risk")).toBe("warning");
  });

  it("maps SLA breached to danger", () => {
    expect(getSlaTone("breached")).toBe("danger");
  });
});
