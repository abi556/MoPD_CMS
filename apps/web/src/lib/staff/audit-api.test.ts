import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildAuditLogsExportUrl,
  buildAuditLogsQuery,
  listAuditLogs,
} from "./audit-api";

vi.mock("@/lib/api-origin", () => ({
  resolveApiV1Prefix: vi.fn(() => "http://localhost:3001/api/v1"),
}));

vi.mock("@/lib/api-client", () => ({
  apiGet: vi.fn(),
}));

import { apiGet } from "@/lib/api-client";

const mockGet = vi.mocked(apiGet);

describe("audit-api", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("builds audit query from filters", () => {
    expect(
      buildAuditLogsQuery({
        eventType: "auth.login.succeeded",
        actorUserId: "u1",
        entityType: "complaint",
        entityId: "cmp_1",
        createdFrom: "2026-01-01T00:00:00.000Z",
        createdTo: "2026-01-31T23:59:59.999Z",
        limit: 20,
        cursor: "cursor_1",
      }),
    ).toBe(
      "?eventType=auth.login.succeeded&actorUserId=u1&entityType=complaint&entityId=cmp_1&createdFrom=2026-01-01T00%3A00%3A00.000Z&createdTo=2026-01-31T23%3A59%3A59.999Z&limit=20&cursor=cursor_1",
    );
  });

  it("builds export URL", () => {
    expect(
      buildAuditLogsExportUrl({
        eventType: "auth.login.succeeded",
        limit: 10,
      }),
    ).toBe(
      "http://localhost:3001/api/v1/audit-logs/export?eventType=auth.login.succeeded&limit=10",
    );
  });

  it("calls list endpoint with query", async () => {
    mockGet.mockResolvedValue({ data: [], meta: { hasNext: false, nextCursor: null } });
    await listAuditLogs({ limit: 25 });
    expect(mockGet).toHaveBeenCalledWith("/audit-logs?limit=25");
  });
});
