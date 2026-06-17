import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildReportExportDownloadPath,
  createReportExport,
  getChannelsDashboard,
  getReportExportDownload,
  getReportExportStatus,
  getResolutionDashboard,
  getSlaDashboard,
  getVolumeDashboard,
} from "./reports-api";

vi.mock("@/lib/api-origin", () => ({
  resolveApiV1Prefix: vi.fn(() => "http://localhost:3001/api/v1"),
}));

vi.mock("@/lib/api-client", () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
}));

import { apiGet, apiPost } from "@/lib/api-client";

const mockGet = vi.mocked(apiGet);
const mockPost = vi.mocked(apiPost);

const filters = {
  from: "2026-01-01",
  to: "2026-01-31",
  bucket: "day" as const,
};

describe("reports-api", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("queries volume dashboard", async () => {
    mockGet.mockResolvedValue({
      buckets: [],
      series: [],
      events: { submitted: [], closed: [] },
      meta: { ...filters, total: 0 },
    });
    await getVolumeDashboard(filters);
    expect(mockGet).toHaveBeenCalledWith(
      "/reports/dashboard/volume?from=2026-01-01&to=2026-01-31&bucket=day",
    );
  });

  it("queries sla dashboard", async () => {
    mockGet.mockResolvedValue({
      onTimePct: 0,
      breachedPct: 0,
      onTimeCount: 0,
      breachedCount: 0,
      activeCount: 0,
      total: 0,
      meta: filters,
    });
    await getSlaDashboard(filters);
    expect(mockGet).toHaveBeenCalledWith(
      "/reports/dashboard/sla?from=2026-01-01&to=2026-01-31&bucket=day",
    );
  });

  it("queries resolution dashboard", async () => {
    mockGet.mockResolvedValue({
      avgResolutionHours: null,
      resolutionRate: 0,
      backlog: 0,
      closedCount: 0,
      createdCount: 0,
      byBucket: [],
      meta: filters,
    });
    await getResolutionDashboard(filters);
    expect(mockGet).toHaveBeenCalledWith(
      "/reports/dashboard/resolution?from=2026-01-01&to=2026-01-31&bucket=day",
    );
  });

  it("queries channels dashboard", async () => {
    mockGet.mockResolvedValue({ channels: [], meta: { ...filters, total: 0 } });
    await getChannelsDashboard(filters);
    expect(mockGet).toHaveBeenCalledWith(
      "/reports/dashboard/channels?from=2026-01-01&to=2026-01-31&bucket=day",
    );
  });

  it("creates export job", async () => {
    mockPost.mockResolvedValue({
      id: "exp_1",
      status: "PENDING",
      createdAt: "2026-01-01T00:00:00.000Z",
    });
    await createReportExport({
      ...filters,
      format: "csv",
      reportType: "complaints",
    });
    expect(mockPost).toHaveBeenCalledWith("/reports/export", {
      from: "2026-01-01",
      to: "2026-01-31",
      bucket: "day",
      format: "csv",
      reportType: "complaints",
    });
  });

  it("gets export status", async () => {
    mockGet.mockResolvedValue({
      id: "exp_1",
      status: "READY",
      createdAt: "2026-01-01T00:00:00.000Z",
    });
    await getReportExportStatus("exp_1");
    expect(mockGet).toHaveBeenCalledWith("/reports/export/exp_1");
  });

  it("gets export download", async () => {
    mockGet.mockResolvedValue({
      url: "http://localhost/file.csv",
      expiresAt: "2026-01-01T00:10:00.000Z",
    });
    await getReportExportDownload("exp_1");
    expect(mockGet).toHaveBeenCalledWith("/reports/export/exp_1/download");
  });

  it("builds absolute export download path", () => {
    expect(buildReportExportDownloadPath("exp_1")).toBe(
      "http://localhost:3001/api/v1/reports/export/exp_1/download",
    );
  });
});
