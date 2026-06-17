import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { StaffAlert } from "./staff-alert";

describe("StaffAlert", () => {
  it("renders error variant with alert role", () => {
    render(<StaffAlert variant="error">Failed to load</StaffAlert>);
    expect(screen.getByRole("alert")).toHaveTextContent("Failed to load");
  });

  it("renders success variant with status role", () => {
    render(<StaffAlert variant="success">Saved</StaffAlert>);
    expect(screen.getByRole("status")).toHaveTextContent("Saved");
  });
});
