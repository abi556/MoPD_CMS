import type { SessionUser } from "./session-types";

const ROLE_LANDING: Array<{ role: string; path: string }> = [
  { role: "SuperAdmin", path: "/dashboard" },
  { role: "SystemAdmin", path: "/dashboard/admin" },
  { role: "CommunicationsOfficer", path: "/dashboard/admin" },
  { role: "Auditor", path: "/dashboard/reports" },
  { role: "Ombudsperson", path: "/dashboard/complaints" },
  {
    role: "ReviewerApprover",
    path: "/dashboard/complaints?status=QA_LEGAL_REVIEW",
  },
  { role: "CaseOfficer", path: "/dashboard/complaints?queue=triage" },
  { role: "ComplaintsAdmin", path: "/dashboard/complaints" },
  { role: "ReadOnlyObserver", path: "/dashboard/reports" },
];

/** Returns path **without** locale prefix (e.g. `/dashboard`). */
export function resolvePostLoginPath(user: SessionUser): string {
  for (const entry of ROLE_LANDING) {
    if (user.roles.includes(entry.role)) {
      return entry.path;
    }
  }
  return "/dashboard";
}
