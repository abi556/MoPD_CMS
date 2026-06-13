import { describe, expect, it } from "vitest";
import { buildComplaintsQuery } from "./complaints-api";

describe("buildComplaintsQuery", () => {
  it("builds query with filters", () => {
    expect(
      buildComplaintsQuery({
        page: 2,
        pageSize: 10,
        status: "TRIAGE",
        channel: "WEB",
        locale: "en",
        submittedFrom: "2026-01-01T00:00:00.000Z",
      }),
    ).toBe(
      "?page=2&pageSize=10&status=TRIAGE&channel=WEB&locale=en&submittedFrom=2026-01-01T00%3A00%3A00.000Z",
    );
  });

  it("returns empty string when no params", () => {
    expect(buildComplaintsQuery({})).toBe("");
  });
});
