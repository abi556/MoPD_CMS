import { describe, expect, it } from "vitest";
import {
  applyQueuePreset,
  parseComplaintFiltersFromSearch,
  serializeComplaintFilters,
} from "./complaint-filters";

describe("complaint-filters", () => {
  it("maps queue=triage to status=TRIAGE", () => {
    expect(
      applyQueuePreset({ page: 1, pageSize: 20, queue: "triage" }),
    ).toEqual({ page: 1, pageSize: 20, status: "TRIAGE", queue: undefined });
  });

  it("maps queue=qa to status=QA_LEGAL_REVIEW", () => {
    expect(applyQueuePreset({ page: 1, pageSize: 20, queue: "qa" })).toEqual({
      page: 1,
      pageSize: 20,
      status: "QA_LEGAL_REVIEW",
      queue: undefined,
    });
  });

  it("parses search params", () => {
    const params = parseComplaintFiltersFromSearch(
      new URLSearchParams("status=TRIAGE&page=2&channel=WEB&q=water"),
    );
    expect(params.status).toBe("TRIAGE");
    expect(params.page).toBe(2);
    expect(params.channel).toBe("WEB");
    expect(params.q).toBe("water");
  });

  it("serializes filters omitting defaults", () => {
    expect(
      serializeComplaintFilters({ page: 1, pageSize: 20, status: "TRIAGE" }),
    ).toEqual({ status: "TRIAGE" });
    expect(
      serializeComplaintFilters({ page: 1, pageSize: 20, q: "CMS-2026" }),
    ).toEqual({ q: "CMS-2026" });
  });
});
