import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { StaffTabs } from "./staff-tabs";

describe("StaffTabs", () => {
  it("calls onChange when an enabled tab is clicked", () => {
    const onChange = vi.fn();

    render(
      <StaffTabs
        tabs={[
          { id: "account", label: "Account" },
          { id: "security", label: "Security" },
        ]}
        activeId="account"
        onChange={onChange}
      />,
    );

    fireEvent.click(screen.getByRole("tab", { name: "Security" }));
    expect(onChange).toHaveBeenCalledWith("security");
  });

  it("does not call onChange for disabled tabs", () => {
    const onChange = vi.fn();

    render(
      <StaffTabs
        tabs={[
          { id: "account", label: "Account" },
          { id: "locked", label: "Locked", disabled: true },
        ]}
        activeId="account"
        onChange={onChange}
      />,
    );

    fireEvent.click(screen.getByRole("tab", { name: "Locked" }));
    expect(onChange).not.toHaveBeenCalled();
  });
});
