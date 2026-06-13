"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ApiError } from "@/lib/api-client";
import {
  deleteComplaintDocument,
  getDocumentDownloadUrl,
  listComplaintDocuments,
  uploadComplaintDocument,
  type ComplaintDocument,
} from "@/lib/staff/documents-api";
import { hasPermission, canUploadDocuments } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";

interface ComplaintDocumentsTabProps {
  complaintId: string;
  permissions: string[];
}

const ALLOWED_UPLOAD_ACCEPT =
  ".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.mp4,.mp3,application/pdf";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ComplaintDocumentsTab({
  complaintId,
  permissions,
}: ComplaintDocumentsTabProps) {
  const t = useTranslations("complaints.documents");
  const canRead =
    hasPermission(permissions, "document:read") ||
    hasPermission(permissions, "complaint:read");
  const canUpload = canUploadDocuments(permissions);
  const canDelete = hasPermission(permissions, "document:delete");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [documents, setDocuments] = useState<ComplaintDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const fetchDocuments = useCallback(async () => {
    if (!canRead) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(undefined);
    try {
      const data = await listComplaintDocuments(complaintId);
      setDocuments(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [canRead, complaintId, t]);

  useEffect(() => {
    void fetchDocuments();
  }, [fetchDocuments]);

  const handleUpload = async (file: File | undefined) => {
    if (!file || !canUpload) return;
    setUploading(true);
    setError(undefined);
    try {
      await uploadComplaintDocument(complaintId, file);
      await fetchDocuments();
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("uploadFailed"));
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (doc: ComplaintDocument) => {
    if (doc.scanStatus !== "CLEAN") {
      setError(t("downloadNotReady"));
      return;
    }
    setError(undefined);
    try {
      const signed = await getDocumentDownloadUrl(doc.id);
      window.open(signed.url, "_blank", "noopener,noreferrer");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("downloadFailed"));
    }
  };

  const handleDelete = async (doc: ComplaintDocument) => {
    if (!canDelete) return;
    setError(undefined);
    try {
      await deleteComplaintDocument(doc.id);
      await fetchDocuments();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("deleteFailed"));
    }
  };

  if (!canRead) {
    return (
      <EmptyState title={t("emptyTitle")} description={t("noAccessDescription")} />
    );
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <LoadingSkeleton className="h-10 w-full" />
        <LoadingSkeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-xl border border-staff-border bg-staff-surface p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-staff-text">{t("title")}</h3>
          <p className="mt-1 text-sm text-staff-text-muted">{t("description")}</p>
        </div>
        {canUpload ? (
          <>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept={ALLOWED_UPLOAD_ACCEPT}
              onChange={(e) => void handleUpload(e.target.files?.[0])}
            />
            <Button
              type="button"
              disabled={uploading}
              className="min-h-11 cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? t("uploading") : t("upload")}
            </Button>
          </>
        ) : null}
      </div>

      {canUpload ? (
        <p className="text-xs text-staff-text-muted">{t("uploadHint")}</p>
      ) : null}

      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      {documents.length === 0 ? (
        <EmptyState title={t("emptyTitle")} description={t("emptyDescription")} />
      ) : (
        <ul className="divide-y divide-staff-border rounded-lg border border-staff-border">
          {documents.map((doc) => (
            <li
              key={doc.id}
              className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-staff-text">
                  {doc.originalName}
                </p>
                <p className="text-staff-text-muted">
                  {formatBytes(doc.sizeBytes)} · {t(`scanStatus.${doc.scanStatus}`)} ·{" "}
                  {new Date(doc.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="min-h-11 cursor-pointer"
                  disabled={doc.scanStatus !== "CLEAN"}
                  onClick={() => void handleDownload(doc)}
                >
                  {t("download")}
                </Button>
                {canDelete ? (
                  <Button
                    type="button"
                    variant="secondary"
                    className="min-h-11 cursor-pointer"
                    onClick={() => void handleDelete(doc)}
                  >
                    {t("delete")}
                  </Button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
