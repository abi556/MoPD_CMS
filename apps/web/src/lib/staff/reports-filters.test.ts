import { describe, expect, it } from "vitest";
import { buildReportFiltersQuery } from "./reports-filters";

describe("buildReportFiltersQuery", () => {
  it("serializes required fields", () => {
    expect(
      buildReportFiltersQuery({
        from: "2026-01-01",
        to: "2026-01-31",
      }),
    ).toBe("?from=2026-01-01&to=2026-01-31");
  });

  it("serializes optional filters", () => {
    expect(
      buildReportFiltersQuery({
        from: "2026-01-01",
        to: "2026-01-31",
        bucket: "week",
        categoryId: "1b9f8029-08b6-4ce5-a960-83288867b9fc",
        orgUnitId: "3f5e9a22-ef18-4960-bc6c-1ff57ed8f0e8",
      }),
    ).toBe(
      "?from=2026-01-01&to=2026-01-31&bucket=week&categoryId=1b9f8029-08b6-4ce5-a960-83288867b9fc&orgUnitId=3f5e9a22-ef18-4960-bc6c-1ff57ed8f0e8",
    );
  });
});
