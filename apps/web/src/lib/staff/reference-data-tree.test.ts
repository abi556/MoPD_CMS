import { describe, expect, it } from "vitest";
import { buildReferenceTree, type ReferenceDataItem } from "./reference-data-tree";

function item(
  overrides: Partial<ReferenceDataItem> & Pick<ReferenceDataItem, "id" | "code" | "nameEn">,
): ReferenceDataItem {
  return {
    parentId: null,
    nameAm: null,
    isActive: true,
    sortOrder: 0,
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("buildReferenceTree", () => {
  it("returns flat list sorted by sortOrder then nameEn", () => {
    const rows = buildReferenceTree([
      item({ id: "b", code: "B", nameEn: "Beta", sortOrder: 1 }),
      item({ id: "a", code: "A", nameEn: "Alpha", sortOrder: 0 }),
    ]);
    expect(rows.map((r) => r.item.id)).toEqual(["a", "b"]);
    expect(rows.every((r) => r.depth === 0)).toBe(true);
  });

  it("nests children under parents with depth", () => {
    const rows = buildReferenceTree([
      item({ id: "root", code: "ROOT", nameEn: "Root" }),
      item({ id: "child", code: "CHILD", nameEn: "Child", parentId: "root" }),
    ]);
    expect(rows.map((r) => [r.item.id, r.depth])).toEqual([
      ["root", 0],
      ["child", 1],
    ]);
  });

  it("handles orphaned children at root level", () => {
    const rows = buildReferenceTree([
      item({ id: "orphan", code: "O", nameEn: "Orphan", parentId: "missing" }),
    ]);
    expect(rows).toHaveLength(1);
    expect(rows[0].depth).toBe(0);
  });
});
