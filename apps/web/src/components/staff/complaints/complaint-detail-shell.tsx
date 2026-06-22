"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { ApiError } from "@/lib/api-client";
import {
  getComplaint,
  getComplaintHistory,
  getComplaintSla,
  type ComplaintDetail,
  type ComplaintHistoryItem,
} from "@/lib/staff/complaints-api";
import type { ComplaintSlaStatus } from "@/lib/staff/sla-status";
import { listUsers } from "@/lib/staff/users-api";
import {
  canAppeal,
  canApproveQa,
  canAssign,
  canAssignFromStatus,
  canEscalate,
  canReturnForRevision,
  showGenericTransition,
} from "@/lib/staff/complaint-actions";
import { hasPermission } from "@/lib/permissions";
import { staffRoutes } from "@/lib/staff/routes";
import { useSession } from "@/components/providers/auth-provider";
import { useToast } from "@/components/providers/toast-provider";
import { DashboardPageHeader } from "@/components/staff/dashboard/dashboard-page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { StaffTabs } from "@/components/staff/ui/staff-tabs";
import { StaffEmptyState } from "@/components/staff/ui/staff-empty-state";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { SlaCountdown } from "@/components/staff/complaints/sla-countdown";
import { ComplaintOverviewTab } from "@/components/staff/complaints/complaint-overview-tab";
import { ComplaintNotesTab } from "@/components/staff/complaints/complaint-notes-tab";
import { HistoryTimeline } from "@/components/staff/complaints/history-timeline";
import { ComplaintTasksTab } from "@/components/staff/complaints/complaint-tasks-tab";
import { ComplaintResponseTab } from "@/components/staff/complaints/complaint-response-tab";
import { ComplaintDocumentsTab } from "@/components/staff/complaints/complaint-documents-tab";
import { AssignComplaintDialog } from "@/components/staff/complaints/assign-complaint-dialog";
import { TransitionComplaintDialog } from "@/components/staff/complaints/transition-complaint-dialog";
import { EscalateComplaintDialog } from "@/components/staff/complaints/escalate-complaint-dialog";
import { AppealComplaintDialog } from "@/components/staff/complaints/appeal-complaint-dialog";
import { Link } from "@/i18n/navigation";
import { WorkflowBlockedCallout } from "@/components/staff/complaints/workflow-blocked-callout";

type DetailTab = "overview" | "response" | "notes" | "tasks" | "documents" | "history";

type TransitionVariant = "default" | "approve" | "return";

const TAB_LABEL_KEYS: Record<
  DetailTab,
  | "tabOverview"
  | "tabResponse"
  | "tabNotes"
  | "tabTasks"
  | "tabDocuments"
  | "tabHistory"
> = {
  overview: "tabOverview",
  response: "tabResponse",
  notes: "tabNotes",
  tasks: "tabTasks",
  documents: "tabDocuments",
  history: "tabHistory",
};

export function ComplaintDetailShell({ complaintId }: { complaintId: string }) {
  const t = useTranslations("complaints.detail");
  const tActions = useTranslations("complaints.actions");
  const { user } = useSession();
  const { showToast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = (searchParams.get("tab") as DetailTab) || "overview";

  const [complaint, setComplaint] = useState<ComplaintDetail | null>(null);
  const [sla, setSla] = useState<ComplaintSlaStatus | null>(null);
  const [history, setHistory] = useState<ComplaintHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [transitionVariant, setTransitionVariant] =
    useState<TransitionVariant | null>(null);
  const [escalateOpen, setEscalateOpen] = useState(false);
  const [appealOpen, setAppealOpen] = useState(false);
  const [assigneeLabel, setAssigneeLabel] = useState("—");

  const permissions = user?.permissions ?? [];

  const load = useCallback(async () => {
    setLoading(true);
    setNotFound(false);
    try {
      const [detail, slaResult, historyResult] = await Promise.all([
        getComplaint(complaintId),
        getComplaintSla(complaintId).catch(() => null),
        getComplaintHistory(complaintId),
      ]);
      setComplaint(detail);
      setSla(slaResult);
      setHistory(historyResult);

      if (detail.assignedToUserId) {
        if (user?.id === detail.assignedToUserId) {
          setAssigneeLabel(user.email);
        } else if (hasPermission(permissions, "user:manage")) {
          const users = await listUsers({ page: 1, pageSize: 100, isActive: true });
          const match = users.data.find((u) => u.id === detail.assignedToUserId);
          setAssigneeLabel(match?.email ?? detail.assignedToUserId);
        } else {
          setAssigneeLabel(detail.assignedToUserId.slice(0, 8));
        }
      } else {
        setAssigneeLabel("—");
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setNotFound(true);
      }
      setComplaint(null);
    } finally {
      setLoading(false);
    }
  }, [complaintId, permissions, user]);

  useEffect(() => {
    void load();
  }, [load]);

  const setTab = (next: DetailTab) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", next);
    router.replace(`${staffRoutes.complaintDetail(complaintId)}?${params.toString()}`);
  };

  if (loading) {
    return (
      <div className="space-y-4 p-2">
        <LoadingSkeleton className="h-10 w-64" />
        <LoadingSkeleton className="h-48 w-full" />
      </div>
    );
  }

  if (notFound || !complaint || !user) {
    return (
      <StaffEmptyState
        title={t("notFoundTitle")}
        description={t("notFoundDescription")}
        action={
          <Link
            href={staffRoutes.complaints}
            className="text-sm font-medium text-staff-nav-active hover:underline"
          >
            {t("backToQueue")}
          </Link>
        }
      />
    );
  }

  const workflowCtx = {
    userId: user.id,
    roles: user.roles,
    assignedToUserId: complaint.assignedToUserId,
  };

  const showAssign =
    canAssign(permissions, { ...workflowCtx, status: complaint.status }) &&
    canAssignFromStatus(complaint.status);
  const showAssignBlockedHint =
    !showAssign &&
    canAssignFromStatus(complaint.status) &&
    !complaint.assignedToUserId;
  const showApprove = canApproveQa(complaint.status, permissions);
  const showReturn = canReturnForRevision(complaint.status, permissions);
  const showTransition = showGenericTransition(
    complaint.status,
    permissions,
    workflowCtx,
  );
  const showAppeal = canAppeal(complaint.status, permissions);
  const showEscalate = canEscalate(permissions);

  return (
    <div>
      <DashboardPageHeader
        title={complaint.referenceNo}
        subtitle={complaint.subject}
      />

      <div className="mb-6 flex flex-col gap-4 rounded-xl border border-staff-border/40 bg-staff-surface/90 p-4 shadow-staff-card sm:flex-row sm:flex-wrap sm:items-center">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={complaint.status} size="md" />
          <SlaCountdown sla={sla} />
        </div>
        <span className="text-sm text-staff-text-muted sm:border-l sm:border-staff-border/40 sm:pl-4">
          {assigneeLabel}
        </span>
        <div className="flex flex-wrap gap-2 sm:ml-auto">
          {showAssign ? (
            <Button
              className="min-h-11 cursor-pointer"
              onClick={() => setAssignOpen(true)}
            >
              {t("assign")}
            </Button>
          ) : null}
          {showApprove ? (
            <Button
              className="min-h-11 cursor-pointer"
              onClick={() => setTransitionVariant("approve")}
            >
              {t("approve")}
            </Button>
          ) : null}
          {showReturn ? (
            <Button
              variant="staffSecondary"
              className="min-h-11 cursor-pointer"
              onClick={() => setTransitionVariant("return")}
            >
              {t("returnForRevision")}
            </Button>
          ) : null}
          {showTransition ? (
            <Button
              variant="staffSecondary"
              className="min-h-11 cursor-pointer"
              onClick={() => setTransitionVariant("default")}
            >
              {t("transition")}
            </Button>
          ) : null}
          {showAppeal ? (
            <Button
              variant="staffSecondary"
              className="min-h-11 cursor-pointer"
              onClick={() => setAppealOpen(true)}
            >
              {t("appeal")}
            </Button>
          ) : null}
          {showEscalate ? (
            <Button
              variant="staffSecondary"
              className="min-h-11 cursor-pointer"
              onClick={() => setEscalateOpen(true)}
            >
              {t("escalate")}
            </Button>
          ) : null}
        </div>
      </div>

      {showAssignBlockedHint ? (
        <div className="mb-6">
          <WorkflowBlockedCallout
            complaintId={complaint.id}
            info={{
              message: t("assignBlockedHint"),
              requiredRoles: ["ComplaintsAdmin"],
              reasonCode: "missing_permission",
            }}
          />
        </div>
      ) : null}

      {complaint.status === "QA_LEGAL_REVIEW" ? (
        <div className="mb-6 rounded-xl border border-warning/30 bg-warning/10 p-4">
          <p className="text-sm font-medium text-staff-text">{t("qaReviewBanner")}</p>
          {complaint.responseDraft?.trim() ? (
            <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-sm text-staff-text-muted">
              {complaint.responseDraft}
            </p>
          ) : (
            <p className="mt-2 text-sm text-staff-text-muted">{t("qaReviewMissingDraft")}</p>
          )}
          <button
            type="button"
            onClick={() => setTab("response")}
            className="mt-3 cursor-pointer text-sm font-medium text-staff-nav-active underline hover:no-underline"
          >
            {t("viewFullDraft")}
          </button>
        </div>
      ) : null}

      <div className="mb-4">
        <StaffTabs
          ariaLabel={t("tabsLabel")}
          activeId={tab}
          onChange={(id) => setTab(id as DetailTab)}
          tabs={(Object.keys(TAB_LABEL_KEYS) as DetailTab[]).map((id) => ({
            id,
            label: t(TAB_LABEL_KEYS[id]),
          }))}
        />
      </div>

      {tab === "overview" ? (
        <ComplaintOverviewTab
          complaint={complaint}
          permissions={permissions}
          assigneeLabel={assigneeLabel}
          onUpdated={setComplaint}
        />
      ) : null}
      {tab === "response" ? (
        <ComplaintResponseTab
          complaint={complaint}
          permissions={permissions}
          onUpdated={setComplaint}
        />
      ) : null}
      {tab === "notes" ? (
        <ComplaintNotesTab complaintId={complaint.id} permissions={permissions} />
      ) : null}
      {tab === "tasks" ? (
        <ComplaintTasksTab complaintId={complaint.id} permissions={permissions} />
      ) : null}
      {tab === "documents" ? (
        <ComplaintDocumentsTab
          complaintId={complaint.id}
          permissions={permissions}
        />
      ) : null}
      {tab === "history" ? <HistoryTimeline items={history} /> : null}

      <AssignComplaintDialog
        open={assignOpen}
        complaintId={complaint.id}
        sessionUserId={user.id}
        sessionRoles={user.roles}
        permissions={permissions}
        onClose={() => setAssignOpen(false)}
        onSuccess={() => void load()}
      />
      <TransitionComplaintDialog
        open={transitionVariant !== null}
        complaintId={complaint.id}
        currentStatus={complaint.status}
        sessionUserId={user.id}
        sessionRoles={user.roles}
        assignedToUserId={complaint.assignedToUserId}
        permissions={permissions}
        variant={transitionVariant ?? "default"}
        onClose={() => setTransitionVariant(null)}
        onSuccess={() => void load()}
      />
      <EscalateComplaintDialog
        open={escalateOpen}
        complaintId={complaint.id}
        onClose={() => setEscalateOpen(false)}
        onSuccess={() => {
          showToast(tActions("escalateSuccess"), "success");
        }}
      />
      <AppealComplaintDialog
        open={appealOpen}
        complaintId={complaint.id}
        onClose={() => setAppealOpen(false)}
        onSuccess={() => void load()}
      />
    </div>
  );
}
