import { describe, expect, it } from "vitest";
import { formatSlaCountdown, mapSlaToState } from "./sla-status";

describe("sla-status", () => {
  it("maps breached SLA", () => {
    expect(
      mapSlaToState({
        complaintId: "1",
        slaConfigName: "Default",
        status: "BREACHED",
        startedAt: "",
        targetAt: "",
        warningAt: "",
        remainingMs: -3600000,
        isWarned: false,
        isBreached: true,
      }),
    ).toBe("breached");
  });

  it("maps warned SLA to at_risk", () => {
    expect(
      mapSlaToState({
        complaintId: "1",
        slaConfigName: "Default",
        status: "ACTIVE",
        startedAt: "",
        targetAt: "",
        warningAt: "",
        remainingMs: 3600000,
        isWarned: true,
        isBreached: false,
      }),
    ).toBe("at_risk");
  });

  it("formats overdue countdown", () => {
    expect(formatSlaCountdown(-7200000)).toContain("overdue");
  });

  it("formats remaining time", () => {
    expect(formatSlaCountdown(3660000)).toMatch(/\d+h/);
  });
});
