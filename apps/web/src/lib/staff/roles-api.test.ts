import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createRole,
  deleteRole,
  listPermissions,
  listRoles,
  updateRole,
} from "./roles-api";

vi.mock("@/lib/api-client", () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPatch: vi.fn(),
  apiDelete: vi.fn(),
}));

import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api-client";

const mockGet = vi.mocked(apiGet);
const mockPost = vi.mocked(apiPost);
const mockPatch = vi.mocked(apiPatch);
const mockDelete = vi.mocked(apiDelete);

describe("roles-api", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("listRoles calls apiGet", async () => {
    mockGet.mockResolvedValue([]);
    await listRoles();
    expect(mockGet).toHaveBeenCalledWith("/roles");
  });

  it("listPermissions calls apiGet", async () => {
    mockGet.mockResolvedValue([]);
    await listPermissions();
    expect(mockGet).toHaveBeenCalledWith("/permissions");
  });

  it("createRole posts payload", async () => {
    mockPost.mockResolvedValue({
      id: "role-x",
      name: "X",
      permissionCodes: ["user:manage"],
    });
    await createRole({
      id: "role-x",
      name: "X",
      permissionIds: ["perm-user-manage"],
    });
    expect(mockPost).toHaveBeenCalledWith(
      "/roles",
      { id: "role-x", name: "X", permissionIds: ["perm-user-manage"] },
      { auth: true },
    );
  });

  it("updateRole patches payload", async () => {
    mockPatch.mockResolvedValue({
      id: "role-x",
      name: "Y",
      permissionCodes: [],
    });
    await updateRole("role-x", { name: "Y" });
    expect(mockPatch).toHaveBeenCalledWith("/roles/role-x", { name: "Y" });
  });

  it("deleteRole calls apiDelete", async () => {
    mockDelete.mockResolvedValue(undefined);
    await deleteRole("role-x");
    expect(mockDelete).toHaveBeenCalledWith("/roles/role-x");
  });
});
