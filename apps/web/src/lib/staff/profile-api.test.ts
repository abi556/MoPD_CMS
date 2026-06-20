import { beforeEach, describe, expect, it, vi } from "vitest";
import { getCurrentUser, updateOwnProfile } from "./profile-api";

vi.mock("@/lib/api-client", () => ({
  apiGet: vi.fn(),
  apiPatch: vi.fn(),
}));

import { apiGet, apiPatch } from "@/lib/api-client";

const mockGet = vi.mocked(apiGet);
const mockPatch = vi.mocked(apiPatch);

describe("profile-api", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getCurrentUser calls apiGet", async () => {
    mockGet.mockResolvedValue({
      id: "u1",
      email: "a@b.c",
      roles: ["CaseOfficer"],
      isActive: true,
      preferredLocale: "en",
    });
    const user = await getCurrentUser();
    expect(mockGet).toHaveBeenCalledWith("/users/me");
    expect(user.preferredLocale).toBe("en");
  });

  it("updateOwnProfile patches email and locale", async () => {
    mockPatch.mockResolvedValue({
      id: "u1",
      email: "new@b.c",
      roles: ["CaseOfficer"],
      isActive: true,
      preferredLocale: "am",
    });
    await updateOwnProfile({ email: "new@b.c", preferredLocale: "am" });
    expect(mockPatch).toHaveBeenCalledWith("/users/me", {
      email: "new@b.c",
      preferredLocale: "am",
    });
  });
});
