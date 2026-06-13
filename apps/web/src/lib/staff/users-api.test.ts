import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildUsersQuery,
  createUser,
  deactivateUser,
  getUser,
  listUsers,
  updateUser,
} from "./users-api";

vi.mock("@/lib/api-client", () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPatch: vi.fn(),
}));

import { apiGet, apiPatch, apiPost } from "@/lib/api-client";

const mockGet = vi.mocked(apiGet);
const mockPost = vi.mocked(apiPost);
const mockPatch = vi.mocked(apiPatch);

describe("buildUsersQuery", () => {
  it("returns empty string when no params", () => {
    expect(buildUsersQuery({})).toBe("");
  });

  it("builds pagination and filter query", () => {
    expect(
      buildUsersQuery({ page: 2, pageSize: 10, email: "admin", isActive: true }),
    ).toBe("?page=2&pageSize=10&email=admin&isActive=true");
  });

  it("encodes inactive filter", () => {
    expect(buildUsersQuery({ isActive: false })).toBe("?isActive=false");
  });
});

describe("users-api", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("listUsers calls apiGet with query", async () => {
    mockGet.mockResolvedValue({ data: [], meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 } });
    await listUsers({ page: 1 });
    expect(mockGet).toHaveBeenCalledWith("/users?page=1");
  });

  it("getUser calls apiGet with id", async () => {
    mockGet.mockResolvedValue({ data: { id: "u1", email: "a@b.c", roles: [], isActive: true } });
    await getUser("u1");
    expect(mockGet).toHaveBeenCalledWith("/users/u1");
  });

  it("createUser posts payload", async () => {
    mockPost.mockResolvedValue({ data: { id: "u1", email: "a@b.c", roles: ["CaseOfficer"], isActive: true } });
    await createUser({ email: "a@b.c", password: "StrongPass123!", roleIds: ["role-case-officer"] });
    expect(mockPost).toHaveBeenCalledWith(
      "/users",
      { email: "a@b.c", password: "StrongPass123!", roleIds: ["role-case-officer"] },
      { auth: true },
    );
  });

  it("updateUser patches payload", async () => {
    mockPatch.mockResolvedValue({ data: { id: "u1", email: "x@y.z", roles: [], isActive: true } });
    await updateUser("u1", { email: "x@y.z" });
    expect(mockPatch).toHaveBeenCalledWith("/users/u1", { email: "x@y.z" });
  });

  it("deactivateUser posts to deactivate endpoint", async () => {
    mockPost.mockResolvedValue({ data: { id: "u1", email: "a@b.c", roles: [], isActive: false } });
    await deactivateUser("u1");
    expect(mockPost).toHaveBeenCalledWith("/users/u1/deactivate", undefined, { auth: true });
  });
});
