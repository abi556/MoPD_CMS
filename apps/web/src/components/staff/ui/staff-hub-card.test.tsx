import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Users } from "lucide-react";
import { StaffHubCard } from "./staff-hub-card";

vi.mock("@/i18n/navigation", () => ({
  Link: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

describe("StaffHubCard", () => {
  it("renders title, description, and link href", () => {
    render(
      <StaffHubCard
        href="/dashboard/admin/users"
        icon={Users}
        title="Users"
        description="Manage staff accounts."
      />,
    );

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/dashboard/admin/users");
    expect(screen.getByText("Users")).toBeInTheDocument();
    expect(screen.getByText("Manage staff accounts.")).toBeInTheDocument();
  });
});
