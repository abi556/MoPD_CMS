import { describe, expect, it } from "vitest";
import {
  roleIdToName,
  roleNameToId,
  roleNamesToIds,
} from "./role-catalog";

describe("role-catalog", () => {
  it("maps known role names to ids", () => {
    expect(roleNameToId("CaseOfficer")).toBe("role-case-officer");
    expect(roleNameToId("SystemAdmin")).toBe("role-system-admin");
  });

  it("maps known role ids to names", () => {
    expect(roleIdToName("role-case-officer")).toBe("CaseOfficer");
  });

  it("maps multiple role names", () => {
    expect(roleNamesToIds(["CaseOfficer", "Auditor"])).toEqual([
      "role-case-officer",
      "role-auditor",
    ]);
  });

  it("throws for unknown role name", () => {
    expect(() => roleNameToId("UnknownRole")).toThrow(/Unknown role name/);
  });

  it("returns id when name unknown for roleIdToName", () => {
    expect(roleIdToName("role-custom")).toBe("role-custom");
  });
});
