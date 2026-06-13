export interface ReferenceDataItem {
  id: string;
  code: string;
  nameEn: string;
  nameAm: string | null;
  parentId: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface TreeRow<T extends ReferenceDataItem> {
  item: T;
  depth: number;
}

export function buildReferenceTree<T extends ReferenceDataItem>(
  items: T[],
): TreeRow<T>[] {
  const byParent = new Map<string | null, T[]>();

  for (const item of items) {
    const key = item.parentId;
    const siblings = byParent.get(key);
    if (siblings) {
      siblings.push(item);
    } else {
      byParent.set(key, [item]);
    }
  }

  for (const siblings of byParent.values()) {
    siblings.sort(
      (a, b) =>
        a.sortOrder - b.sortOrder ||
        a.nameEn.localeCompare(b.nameEn, undefined, { sensitivity: "base" }),
    );
  }

  const result: TreeRow<T>[] = [];
  const visited = new Set<string>();

  function walk(parentId: string | null, depth: number) {
    const children = byParent.get(parentId) ?? [];
    for (const child of children) {
      if (visited.has(child.id)) continue;
      visited.add(child.id);
      result.push({ item: child, depth });
      walk(child.id, depth + 1);
    }
  }

  walk(null, 0);

  for (const item of items) {
    if (!visited.has(item.id)) {
      result.push({ item, depth: 0 });
    }
  }

  return result;
}
