import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AuditExplorerView } from "./audit-explorer-view";
import type { AuditLogListResponse } from "@/lib/staff/audit-api";

const listAuditLogs = vi.hoisted(() => vi.fn());

vi.mock("@/lib/staff/audit-api", () => ({
  listAuditLogs,
  buildAuditLogsExportUrl: vi.fn(() => "/api/v1/audit-logs/export"),
}));

vi.mock("next-intl", () => ({
  useTranslations: (namespace: string) => {
    const audit: Record<string, string> = {
      title: "Audit log",
      subtitle: "Filterable audit explorer.",
      exportCsv: "Export CSV",
      eventType: "Event type",
      actorUserId: "Actor user id",
      entityType: "Entity type",
      entityId: "Entity id",
      applyFilters: "Apply filters",
      reset: "Reset",
      event: "Event",
      actor: "Actor",
      entity: "Entity",
      created: "Created",
      details: "Details",
      view: "View",
      loading: "Loading…",
      empty: "No audit logs found.",
      loadFailed: "Failed to load audit logs",
      detailTitle: "Audit event details",
      previous: "Previous",
      next: "Next",
      allEvents: "All events",
      "events.authLoginSucceeded": "auth.login.succeeded",
      "events.complaintTransitioned": "complaint.transitioned",
      "events.reportExportRequested": "report.export.requested",
    };
    if (namespace === "admin.audit") {
      return (subKey: string) => audit[subKey] ?? subKey;
    }
    return (subKey: string) => subKey;
  },
}));

describe("AuditExplorerView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads logs, opens details dialog, and paginates cursor results", async () => {
    const pageOne: AuditLogListResponse = {
      data: [
        {
          id: "log-1",
          eventType: "complaint.transitioned",
          actorUserId: "user-1",
          entityType: "complaint",
          entityId: "cmp-1",
          createdAt: "2026-06-15T09:00:00.000Z",
        },
      ],
      meta: { hasNext: true, nextCursor: "next-1" },
    };
    const pageTwo: AuditLogListResponse = {
      data: [
        {
          id: "log-2",
          eventType: "report.export.requested",
          actorUserId: "user-2",
          entityType: "report_export",
          entityId: "exp-1",
          createdAt: "2026-06-15T10:00:00.000Z",
        },
      ],
      meta: { hasNext: false, nextCursor: null },
    };
    listAuditLogs.mockResolvedValueOnce(pageOne).mockResolvedValueOnce(pageTwo);

    render(<AuditExplorerView />);

    await waitFor(() => {
      expect(screen.getByText("complaint.transitioned")).toBeInTheDocument();
    });
    expect(listAuditLogs).toHaveBeenCalledWith({ limit: 20, cursor: undefined });

    fireEvent.click(screen.getByRole("button", { name: "View" }));
    expect(screen.getByText("Audit event details")).toBeInTheDocument();
    expect(screen.getByText(/"id": "log-1"/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    await waitFor(() => {
      expect(screen.getByText("report.export.requested")).toBeInTheDocument();
    });
    expect(listAuditLogs).toHaveBeenLastCalledWith({ limit: 20, cursor: "next-1" });
  });
});
