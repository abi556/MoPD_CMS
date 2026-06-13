import { describe, expect, it, vi } from "vitest";
import { apiGet } from "./api-client";

describe("apiGet envelope parsing", () => {
  it("unwraps simple { data: T } responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ data: [{ id: "role-1", name: "Admin" }] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    const roles = await apiGet<Array<{ id: string; name: string }>>("/roles", {
      auth: false,
    });
    expect(roles).toEqual([{ id: "role-1", name: "Admin" }]);
  });

  it("preserves paginated { data, meta } responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            data: [{ id: "u1", email: "a@b.c", roles: [], isActive: true }],
            meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      ),
    );

    const page = await apiGet<{
      data: Array<{ id: string }>;
      meta: { total: number };
    }>("/users", { auth: false });

    expect(page.data).toHaveLength(1);
    expect(page.meta.total).toBe(1);
  });
});
