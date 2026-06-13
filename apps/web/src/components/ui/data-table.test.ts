import { describe, expect, it } from "vitest";
import { getTotalPages } from "./data-table";

describe("getTotalPages", () => {
  it("returns 0 when total is 0", () => {
    expect(getTotalPages(0, 20)).toBe(0);
  });

  it("calculates pages for exact division", () => {
    expect(getTotalPages(40, 20)).toBe(2);
  });

  it("rounds up partial page", () => {
    expect(getTotalPages(41, 20)).toBe(3);
  });
});
