"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listRecoveryInquiries(
        statusFilter || undefined,
      );
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
    <div className="space-y-6">
      <div>
        <h1 className="text-h1 font-semibold text-on-surface">{t("title")}</h1>
        <p className="mt-1 text-body text-text-secondary">{t("intro")}</p>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-1">
          <label htmlFor="statusFilter" className="text-sm font-medium">
            {t("status")}
          </label>
          <select
            id="statusFilter"
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as RecoveryInquiryStatus | "")
            }
            className="min-h-11 rounded-md border border-border-standard bg-surface px-3 py-2 text-sm"
          >
            <option value="">All</option>
            <option value="PENDING">PENDING</option>
            <option value="IN_REVIEW">IN_REVIEW</option>
            <option value="RESOLVED">RESOLVED</option>
            <option value="REJECTED">REJECTED</option>
          </select>
        </div>
        <Button type="button" variant="secondary" onClick={() => void load()}>
          Refresh
        </Button>
      </div>

      {error ? (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="text-body text-text-secondary">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-body text-text-secondary">{t("noItems")}</p>
      ) : (
        <ul className="space-y-4">
          {items.map((item) => (
            <li
              key={item.id}
              className="rounded-lg border border-border-standard bg-surface p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-on-surface">
                    {item.subjectFragment}
                  </p>
                  <p className="text-body-sm text-text-secondary">
                    {t("status")}: {item.status} · {t("submitted")}:{" "}
                    {new Date(item.createdAt).toLocaleString()}
                  </p>
                  <p className="text-body-sm text-text-secondary">
                    {t("contactEmail")}:{" "}
                    <a
                      href={`mailto:${item.contactEmail}`}
                      className="text-primary hover:underline"
                    >
                      {item.contactEmail}
                    </a>
                  </p>
                  {item.submittedDateEthiopian ? (
                    <p className="text-body-sm text-text-secondary">
                      EC: {item.submittedDateEthiopian}
                    </p>
                  ) : null}
                  {item.additionalNotes ? (
                    <p className="mt-2 text-body-sm">{item.additionalNotes}</p>
                  ) : null}
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => void loadCandidates(item.id)}
                >
                  {t("loadCandidates")}
                </Button>
              </div>

              {selectedId === item.id ? (
                <div className="mt-4 space-y-3 border-t border-border-standard pt-4">
                  {candidates.length > 0 ? (
                    <ul className="space-y-2 text-body-sm">
                      {candidates.map((c) => (
                        <li key={c.id}>
                          <button
                            type="button"
                            className="text-left text-primary hover:underline"
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
                    <p className="text-body-sm text-text-secondary">
                      No candidates
                    </p>
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
                    <Button type="button" onClick={() => void onResolve(item.id)}>
                      {t("resolve")}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => void onReject(item.id)}
                    >
                      {t("reject")}
                    </Button>
                  </div>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
