import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  deleteComplaintDocument,
  listComplaintDocuments,
} from "./documents-api";

vi.mock("@/lib/api-client", () => ({
  apiGet: vi.fn(),
  apiDelete: vi.fn(),
  apiUpload: vi.fn(),
}));

import { apiDelete, apiGet } from "@/lib/api-client";

const mockGet = vi.mocked(apiGet);
const mockDelete = vi.mocked(apiDelete);

describe("documents-api", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("listComplaintDocuments calls apiGet", async () => {
    mockGet.mockResolvedValue([]);
    await listComplaintDocuments("cm-1");
    expect(mockGet).toHaveBeenCalledWith("/complaints/cm-1/documents");
  });

  it("deleteComplaintDocument calls apiDelete", async () => {
    mockDelete.mockResolvedValue(undefined);
    await deleteComplaintDocument("doc-1");
    expect(mockDelete).toHaveBeenCalledWith("/documents/doc-1");
  });
});
