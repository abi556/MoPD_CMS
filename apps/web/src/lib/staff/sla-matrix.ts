import type { CategoryItem } from "./categories-api";
import type { SlaConfigItem, SlaPriority } from "./sla-api";

export const SLA_PRIORITIES: SlaPriority[] = ["LOW", "NORMAL", "HIGH", "URGENT"];

export interface SlaMatrixCell {
  priority: SlaPriority;
  config: SlaConfigItem | null;
}

export interface SlaMatrixRow {
  categoryId: string | null;
  categoryLabel: string;
  cells: SlaMatrixCell[];
}

export interface SlaMatrix {
  columns: SlaPriority[];
  rows: SlaMatrixRow[];
}

export function buildSlaMatrix(
  configs: SlaConfigItem[],
  categories: CategoryItem[],
): SlaMatrix {
  const activeConfigs = configs.filter((c) => c.isActive);

  const rows: SlaMatrixRow[] = [
    {
      categoryId: null,
      categoryLabel: "All categories",
      cells: SLA_PRIORITIES.map((priority) => ({
        priority,
        config:
          activeConfigs.find(
            (c) => c.categoryId === null && c.priority === priority,
          ) ?? null,
      })),
    },
    ...categories
      .filter((c) => c.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.nameEn.localeCompare(b.nameEn))
      .map((category) => ({
        categoryId: category.id,
        categoryLabel: category.nameEn,
        cells: SLA_PRIORITIES.map((priority) => ({
          priority,
          config:
            activeConfigs.find(
              (c) => c.categoryId === category.id && c.priority === priority,
            ) ?? null,
        })),
      })),
  ];

  return { columns: SLA_PRIORITIES, rows };
}

export function findSlaConfigForCell(
  configs: SlaConfigItem[],
  categoryId: string | null,
  priority: SlaPriority,
): SlaConfigItem | undefined {
  return configs.find(
    (c) => c.categoryId === categoryId && c.priority === priority,
  );
}
