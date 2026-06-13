import { staffPathWithQuery, staffRoutes } from "@/lib/staff/routes";
import type { SessionUser } from "./session-types";

const ROLE_LANDING: Array<{ role: string; path: string }> = [
  { role: "SuperAdmin", path: staffRoutes.home },
  { role: "SystemAdmin", path: staffRoutes.admin.root },
  { role: "CommunicationsOfficer", path: staffRoutes.admin.root },
  { role: "Auditor", path: staffRoutes.reports.root },
  { role: "Ombudsperson", path: staffRoutes.complaints },
  {
    role: "ReviewerApprover",
    path: staffPathWithQuery(staffRoutes.complaints, {
      status: "QA_LEGAL_REVIEW",
    }),
  },
  {
    role: "CaseOfficer",
    path: staffPathWithQuery(staffRoutes.complaints, { queue: "triage" }),
  },
  { role: "ComplaintsAdmin", path: staffRoutes.complaints },
  { role: "ReadOnlyObserver", path: staffRoutes.reports.root },
];

/** Returns path **without** locale prefix (e.g. `/dashboard`). */
export function resolvePostLoginPath(user: SessionUser): string {
  for (const entry of ROLE_LANDING) {
    if (user.roles.includes(entry.role)) {
      return entry.path;
    }
  }
  return staffRoutes.home;
}
