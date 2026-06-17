"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { StaffAlert } from "@/components/staff/ui/staff-alert";
import { StaffEmptyState } from "@/components/staff/ui/staff-empty-state";
import { StaffFilterPanel } from "@/components/staff/ui/staff-filter-panel";
import { StaffPageShell } from "@/components/staff/ui/staff-page-shell";
import { StaffSurfaceCard } from "@/components/staff/ui/staff-surface-card";
import {
  getRecoveryInquiryCandidates,
  listRecoveryInquiries,
  resolveRecoveryInquiry,
  type ComplaintCandidate,
  type RecoveryInquiryItem,
  type RecoveryInquiryStatus,
} from "@/lib/staff-recovery-inquiries";
import { ApiError } from "@/lib/api-client";

export function RecoveryInquiriesPanel() {
  const t = useTranslations("recoveryInquiries");
  const [items, setItems] = useState<RecoveryInquiryItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<RecoveryInquiryStatus | "">(
    "PENDING",
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<ComplaintCandidate[]>([]);
  const [resolvedReferenceNo, setResolvedReferenceNo] = useState("");
  const [matchedComplaintId, setMatchedComplaintId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const statusOptions = useMemo(
    () => [
      { value: "", label: t("statusAll") },
      { value: "PENDING", label: t("statusValues.PENDING") },
      { value: "IN_REVIEW", label: t("statusValues.IN_REVIEW") },
      { value: "RESOLVED", label: t("statusValues.RESOLVED") },
      { value: "REJECTED", label: t("statusValues.REJECTED") },
    ],
    [t],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listRecoveryInquiries(statusFilter || undefined);
      setItems(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("errors.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [statusFilter, t]);

  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
  }, [load]);

  const loadCandidates = async (id: string) => {
    setSelectedId(id);
    try {
      const data = await getRecoveryInquiryCandidates(id);
      setCandidates(data);
      if (data[0]) {
        setMatchedComplaintId(data[0].id);
        setResolvedReferenceNo(data[0].referenceNo);
      }
    } catch {
      setCandidates([]);
    }
  };

  const onResolve = async (id: string) => {
    try {
      await resolveRecoveryInquiry(id, {
        status: "RESOLVED",
        matchedComplaintId: matchedComplaintId || undefined,
        resolvedReferenceNo: resolvedReferenceNo.trim() || undefined,
      });
      await load();
      setSelectedId(null);
      setCandidates([]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("errors.loadFailed"));
    }
  };

  const onReject = async (id: string) => {
    try {
      await resolveRecoveryInquiry(id, { status: "REJECTED" });
      await load();
      setSelectedId(null);
      setCandidates([]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("errors.loadFailed"));
    }
  };

  return (
    <StaffPageShell
      title={t("title")}
      subtitle={t("intro")}
      filterBar={
        <StaffFilterPanel title={t("status")}>
          <div className="flex flex-wrap items-end gap-4">
            <Select
              label={t("status")}
              name="statusFilter"
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as RecoveryInquiryStatus | "")
              }
              options={statusOptions}
            />
            <Button
              type="button"
              variant="secondary"
              className="min-h-11"
              onClick={() => void load()}
            >
              {t("refresh")}
            </Button>
          </div>
        </StaffFilterPanel>
      }
    >
      {error ? <StaffAlert>{error}</StaffAlert> : null}

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <LoadingSkeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <StaffEmptyState title={t("noItems")} />
      ) : (
        <ul className="space-y-4">
          {items.map((item) => (
            <li key={item.id}>
              <StaffSurfaceCard>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-staff-text">
                      {item.subjectFragment}
                    </p>
                    <p className="mt-1 text-sm text-staff-text-muted">
                      {t("status")}: {item.status} · {t("submitted")}:{" "}
                      {new Date(item.createdAt).toLocaleString()}
                    </p>
                    <p className="text-sm text-staff-text-muted">
                      {t("contactEmail")}:{" "}
                      <a
                        href={`mailto:${item.contactEmail}`}
                        className="text-staff-nav-active hover:underline"
                      >
                        {item.contactEmail}
                      </a>
                    </p>
                    {item.submittedDateEthiopian ? (
                      <p className="text-sm text-staff-text-muted">
                        EC: {item.submittedDateEthiopian}
                      </p>
                    ) : null}
                    {item.additionalNotes ? (
                      <p className="mt-2 text-sm text-staff-text">{item.additionalNotes}</p>
                    ) : null}
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    className="min-h-11"
                    onClick={() => void loadCandidates(item.id)}
                  >
                    {t("loadCandidates")}
                  </Button>
                </div>

                {selectedId === item.id ? (
                  <div className="mt-4 space-y-3 border-t border-staff-border pt-4">
                    {candidates.length > 0 ? (
                      <ul className="space-y-2 text-sm">
                        {candidates.map((c) => (
                          <li key={c.id}>
                            <button
                              type="button"
                              className="cursor-pointer text-left text-staff-nav-active hover:underline"
                              onClick={() => {
                                setMatchedComplaintId(c.id);
                                setResolvedReferenceNo(c.referenceNo);
                              }}
                            >
                              {c.referenceNo} — {c.subject}
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-staff-text-muted">{t("noCandidates")}</p>
                    )}
                    <Input
                      label={t("matchedId")}
                      name="matchedId"
                      value={matchedComplaintId}
                      onChange={(e) => setMatchedComplaintId(e.target.value)}
                    />
                    <Input
                      label={t("referenceNo")}
                      name="referenceNo"
                      value={resolvedReferenceNo}
                      onChange={(e) => setResolvedReferenceNo(e.target.value)}
                    />
                    <div className="flex flex-wrap gap-3">
                      <Button
                        type="button"
                        className="min-h-11"
                        onClick={() => void onResolve(item.id)}
                      >
                        {t("resolve")}
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        className="min-h-11"
                        onClick={() => void onReject(item.id)}
                      >
                        {t("reject")}
                      </Button>
                    </div>
                  </div>
                ) : null}
              </StaffSurfaceCard>
            </li>
          ))}
        </ul>
      )}
    </StaffPageShell>
  );
}
