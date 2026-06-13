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

  it("accepts raw JSON arrays (reference-data admin list endpoints)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify([
            { id: "cat-1", code: "CAT01", nameEn: "Test", isActive: true },
          ]),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      ),
    );

    const categories = await apiGet<Array<{ id: string; code: string }>>(
      "/admin/complaint-categories",
      { auth: false },
    );
    expect(categories).toHaveLength(1);
    expect(categories[0].code).toBe("CAT01");
  });

  it("accepts raw JSON objects (reference-data admin create/patch)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({ id: "cat-1", code: "CAT01", nameEn: "Test" }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      ),
    );

    const category = await apiGet<{ id: string; code: string }>(
      "/admin/complaint-categories/cat-1",
      { auth: false },
    );
    expect(category.id).toBe("cat-1");
  });
});
