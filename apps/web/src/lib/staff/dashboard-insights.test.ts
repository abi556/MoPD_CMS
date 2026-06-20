import { describe, expect, it } from "vitest";
import {
  categoryDisplayName,
  formatRelativeTime,
  pageCount,
  paginateItems,
  topCategoryMax,
  type TopCategoryItem,
} from "./dashboard-insights";

const sampleCategory: TopCategoryItem = {
  categoryId: "cat-1",
  code: "LAND",
  nameEn: "Land",
  nameAm: "መሬት",
  count: 4,
};

describe("dashboard-insights helpers", () => {
  it("prefers Amharic category name when locale is am", () => {
    expect(categoryDisplayName(sampleCategory, "am")).toBe("መሬት");
    expect(categoryDisplayName(sampleCategory, "en")).toBe("Land");
  });

  it("computes max category count with floor of 1", () => {
    expect(topCategoryMax([])).toBe(1);
    expect(topCategoryMax([sampleCategory, { ...sampleCategory, count: 9 }])).toBe(9);
  });

  it("formats relative time", () => {
    const now = Date.parse("2026-06-18T12:00:00.000Z");
    const label = formatRelativeTime(
      "2026-06-18T11:00:00.000Z",
      "en",
      now,
    );
    expect(label).toMatch(/hour/i);
  });

  it("paginates queue activity in groups of two", () => {
    const items = [1, 2, 3, 4, 5, 6];
    expect(paginateItems(items, 0, 2)).toEqual([1, 2]);
    expect(paginateItems(items, 1, 2)).toEqual([3, 4]);
    expect(paginateItems(items, 2, 2)).toEqual([5, 6]);
    expect(pageCount(items.length, 2)).toBe(3);
  });
});
