import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { DashboardFilterBar } from "./dashboard-filter-bar";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const labels: Record<string, string> = {
      from: "From",
      to: "To",
      bucket: "Bucket",
      category: "Category",
      orgUnit: "Org unit",
      apply: "Apply",
      reset: "Reset",
      day: "Day",
      week: "Week",
      month: "Month",
      allCategories: "All categories",
      allOrgUnits: "All org units",
    };
    return labels[key] ?? key;
  },
}));

describe("DashboardFilterBar", () => {
  it("emits change callbacks and apply/reset actions", () => {
    const onChange = vi.fn();
    const onApply = vi.fn();
    const onReset = vi.fn();

    render(
      <DashboardFilterBar
        filters={{ from: "2026-01-01", to: "2026-01-31", bucket: "day" }}
        categories={[{ value: "cat-1", label: "Category 1" }]}
        orgUnits={[{ value: "org-1", label: "Org 1" }]}
        onChange={onChange}
        onApply={onApply}
        onReset={onReset}
      />,
    );

    fireEvent.change(screen.getByLabelText("From"), {
      target: { value: "2026-02-01" },
    });
    expect(onChange).toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText("Category"), {
      target: { value: "cat-1" },
    });
    expect(onChange).toHaveBeenCalledTimes(2);

    fireEvent.click(screen.getByRole("button", { name: "Apply" }));
    expect(onApply).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    expect(onReset).toHaveBeenCalledTimes(1);
  });
});
