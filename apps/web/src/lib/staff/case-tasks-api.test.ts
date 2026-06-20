import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createCaseTask,
  listCaseTasks,
  updateCaseTask,
} from "./case-tasks-api";

vi.mock("@/lib/api-client", () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPatch: vi.fn(),
}));

import { apiGet, apiPatch, apiPost } from "@/lib/api-client";

const mockGet = vi.mocked(apiGet);
const mockPost = vi.mocked(apiPost);
const mockPatch = vi.mocked(apiPatch);

describe("case-tasks-api", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("listCaseTasks calls apiGet", async () => {
    mockGet.mockResolvedValue([]);
    await listCaseTasks("cm-1");
    expect(mockGet).toHaveBeenCalledWith("/complaints/cm-1/tasks");
  });

  it("createCaseTask posts payload", async () => {
    mockPost.mockResolvedValue({
      id: "t1",
      complaintId: "cm-1",
      assigneeUserId: "u1",
      createdByUserId: "u2",
      title: "Follow up",
      status: "OPEN",
      dueAt: null,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    });
    await createCaseTask("cm-1", { title: "Follow up", assigneeUserId: "u1" });
    expect(mockPost).toHaveBeenCalledWith("/complaints/cm-1/tasks", {
      title: "Follow up",
      assigneeUserId: "u1",
    });
  });

  it("updateCaseTask patches status", async () => {
    mockPatch.mockResolvedValue({
      id: "t1",
      complaintId: "cm-1",
      assigneeUserId: "u1",
      createdByUserId: "u2",
      title: "Follow up",
      status: "DONE",
      dueAt: null,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-02T00:00:00.000Z",
    });
    await updateCaseTask("cm-1", "t1", { status: "DONE" });
    expect(mockPatch).toHaveBeenCalledWith("/complaints/cm-1/tasks/t1", {
      status: "DONE",
    });
  });
});
