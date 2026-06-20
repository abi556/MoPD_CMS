import { describe, expect, it, vi } from "vitest";
import { buildComplaintsQuery, createAssistedComplaint } from "./complaints-api";

vi.mock("@/lib/api-client", () => ({
  apiGet: vi.fn(),
  apiPatch: vi.fn(),
  apiPost: vi.fn(),
}));

import { apiPost } from "@/lib/api-client";

const mockPost = vi.mocked(apiPost);

describe("buildComplaintsQuery", () => {
  it("builds query with filters", () => {
    expect(
      buildComplaintsQuery({
        page: 2,
        pageSize: 10,
        status: "TRIAGE",
        channel: "WEB",
        locale: "en",
        submittedFrom: "2026-01-01T00:00:00.000Z",
      }),
    ).toBe(
      "?page=2&pageSize=10&status=TRIAGE&channel=WEB&locale=en&submittedFrom=2026-01-01T00%3A00%3A00.000Z",
    );
  });

  it("returns empty string when no params", () => {
    expect(buildComplaintsQuery({})).toBe("");
  });
});

describe("createAssistedComplaint", () => {
  it("posts ASSISTED channel with staff auth", async () => {
    mockPost.mockResolvedValue({ id: "cm-1", referenceNo: "REF-001" });
    await createAssistedComplaint({
      subject: "Walk-in complaint",
      description: "Citizen reported delay at service desk today.",
      locale: "en",
      consentGiven: true,
    });
    expect(mockPost).toHaveBeenCalledWith(
      "/complaints",
      expect.objectContaining({
        channel: "ASSISTED",
        requestUploadSession: false,
        consentGiven: true,
      }),
      { auth: true },
    );
  });
});
