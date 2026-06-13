import { describe, expect, it } from "vitest";
import {
  getPermissionModule,
  groupPermissionsByModule,
  togglePermissionId,
} from "./permission-matrix.utils";

const perms = [
  { id: "p1", code: "user:manage" },
  { id: "p2", code: "role:manage" },
  { id: "p3", code: "complaint:read" },
  { id: "p4", code: "audit:read" },
];

describe("getPermissionModule", () => {
  it("extracts prefix before colon", () => {
    expect(getPermissionModule("user:manage")).toBe("user");
  });

  it("returns other when no colon", () => {
    expect(getPermissionModule("admin")).toBe("other");
  });
});

describe("groupPermissionsByModule", () => {
  it("groups and sorts permissions by module", () => {
    const groups = groupPermissionsByModule(perms);
    expect(groups.map((g) => g.module)).toEqual([
      "audit",
      "complaint",
      "role",
      "user",
    ]);
    expect(groups.find((g) => g.module === "user")?.permissions).toHaveLength(1);
  });
});

describe("togglePermissionId", () => {
  it("adds id when checked", () => {
    expect(togglePermissionId(["p1"], "p2", true)).toEqual(["p1", "p2"]);
  });

  it("does not duplicate id", () => {
    expect(togglePermissionId(["p1"], "p1", true)).toEqual(["p1"]);
  });

  it("removes id when unchecked", () => {
    expect(togglePermissionId(["p1", "p2"], "p1", false)).toEqual(["p2"]);
  });
});
