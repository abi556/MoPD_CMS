import type { Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

export function createAxeBuilder(page: Page): AxeBuilder {
  return new AxeBuilder({ page }).withTags([
    "wcag2a",
    "wcag2aa",
    "wcag21a",
    "wcag21aa",
  ]);
}
