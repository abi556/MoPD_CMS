import { describe, expect, it, vi, beforeEach } from "vitest";
import { fetchDashboardKpis } from "./complaint-kpis";
import * as complaintsApi from "./complaints-api";

describe("fetchDashboardKpis", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("aggregates open count from total minus closed", async () => {
    vi.spyOn(complaintsApi, "listComplaints").mockImplementation(async (params) => {
      const status = params?.status;
      const totals: Record<string, number> = {
        "": 100,
        CLOSED: 30,
        TRIAGE: 12,
        QA_LEGAL_REVIEW: 5,
      };
      return {
        data: [],
        meta: {
          page: 1,
          pageSize: 1,
          total: totals[status ?? ""] ?? 0,
          totalPages: 1,
        },
      };
    });

    const kpis = await fetchDashboardKpis();
    expect(kpis.totalOpen).toBe(70);
    expect(kpis.triageQueue).toBe(12);
    expect(kpis.qaReview).toBe(5);
  });
});
