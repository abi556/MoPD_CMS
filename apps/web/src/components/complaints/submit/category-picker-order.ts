import type { ComplaintFormOptionItem } from "@/lib/public-complaints";

/** First four shown when the category list is collapsed (must match backend codes). */
export const FEATURED_CATEGORY_CODES = [
  "CORRUPTION",
  "GOVT_SERVICE",
  "PUBLIC_SAFETY",
  "EDUCATION",
] as const;

const featuredCodeSet = new Set<string>(FEATURED_CATEGORY_CODES);

/** Featured categories first (fixed order), then all others in API order. */
export function sortCategoriesForPicker(
  categories: ComplaintFormOptionItem[],
): ComplaintFormOptionItem[] {
  const byCode = new Map(categories.map((c) => [c.code, c]));
  const featured: ComplaintFormOptionItem[] = [];

  for (const code of FEATURED_CATEGORY_CODES) {
    const cat = byCode.get(code);
    if (cat) {
      featured.push(cat);
    }
  }

  const rest = categories.filter((c) => !featuredCodeSet.has(c.code));
  return [...featured, ...rest];
}
