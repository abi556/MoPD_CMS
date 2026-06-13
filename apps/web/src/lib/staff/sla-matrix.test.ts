import { describe, expect, it } from "vitest";
import { buildSlaMatrix, SLA_PRIORITIES } from "./sla-matrix";
import type { SlaConfigItem } from "./sla-api";
import type { CategoryItem } from "./categories-api";

function config(
  overrides: Partial<SlaConfigItem> & Pick<SlaConfigItem, "id" | "priority">,
): SlaConfigItem {
  return {
    name: "Default",
    categoryId: null,
    targetHours: 24,
    warningThresholdPct: 80,
    escalationRoleId: null,
    isActive: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("buildSlaMatrix", () => {
  it("includes all priorities as columns", () => {
    const matrix = buildSlaMatrix([], []);
    expect(matrix.columns).toEqual(SLA_PRIORITIES);
  });

  it("maps config to category and priority cell", () => {
    const categories: CategoryItem[] = [
      {
        id: "cat-1",
        code: "ROAD",
        nameEn: "Road",
        nameAm: null,
        parentId: null,
        isActive: true,
        sortOrder: 0,
        createdAt: "",
      },
    ];
    const configs = [
      config({ id: "sla-1", priority: "HIGH", categoryId: "cat-1", targetHours: 48 }),
    ];
    const matrix = buildSlaMatrix(configs, categories);
    const row = matrix.rows.find((r) => r.categoryId === "cat-1");
    const cell = row?.cells.find((c) => c.priority === "HIGH");
    expect(cell?.config?.targetHours).toBe(48);
  });

  it("places global configs on all-categories row", () => {
    const configs = [config({ id: "sla-g", priority: "NORMAL", categoryId: null, targetHours: 72 })];
    const matrix = buildSlaMatrix(configs, []);
    const globalRow = matrix.rows.find((r) => r.categoryId === null);
    const cell = globalRow?.cells.find((c) => c.priority === "NORMAL");
    expect(cell?.config?.id).toBe("sla-g");
  });
});
