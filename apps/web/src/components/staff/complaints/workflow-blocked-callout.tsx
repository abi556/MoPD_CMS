"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { staffRoutes } from "@/lib/staff/routes";

export interface WorkflowBlockedInfo {
  message: string;
  requiredRoles?: string[];
  reasonCode?: string;
}

export function WorkflowBlockedCallout({
  info,
  complaintId,
  showCreateTaskLink = true,
}: {
  info: WorkflowBlockedInfo;
  complaintId?: string;
  showCreateTaskLink?: boolean;
}) {
  const t = useTranslations("complaints.actions.workflowBlocked");

  const rolesLabel =
    info.requiredRoles && info.requiredRoles.length > 0
      ? info.requiredRoles.map((role) => t(`roles.${role}`, { defaultValue: role })).join(", ")
      : undefined;

  return (
    <div
      className="rounded-lg border border-amber-500/35 bg-amber-500/10 px-4 py-3 text-sm text-staff-text"
      role="status"
    >
      <p className="font-medium text-amber-100">{t("title")}</p>
      <p className="mt-1 text-staff-text-muted">{info.message}</p>
      {rolesLabel ? (
        <p className="mt-2 text-staff-text-muted">
          {t("handledBy", { roles: rolesLabel })}
        </p>
      ) : null}
      {info.reasonCode ? (
        <p className="mt-1 text-xs text-staff-text-muted">
          {t(`reasons.${info.reasonCode}`, { defaultValue: info.reasonCode })}
        </p>
      ) : null}
      {showCreateTaskLink && complaintId ? (
        <p className="mt-3">
          <Link
            href={`${staffRoutes.complaintDetail(complaintId)}?tab=tasks`}
            className="font-medium text-staff-nav-active hover:underline"
          >
            {t("createTask")}
          </Link>
        </p>
      ) : null}
    </div>
  );
}

export function workflowBlockedFromApiError(err: {
  message: string;
  details?: {
    requiredRoles?: string[];
    reasonCode?: string;
  };
}): WorkflowBlockedInfo {
  return {
    message: err.message,
    requiredRoles: err.details?.requiredRoles,
    reasonCode: err.details?.reasonCode,
  };
}
