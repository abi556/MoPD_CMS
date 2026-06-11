"use client";

import { useCallback, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  ImageIcon,
  Send,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ComplaintUploadSession } from "@/lib/public-complaints";
import { uploadComplaintEvidence } from "@/lib/public-complaints";
import { ApiError } from "@/lib/api-client";

type EvidencePanelState = "idle" | "uploading" | "complete";

interface FileEntry {
  id: string;
  file: File;
  status: "pending" | "uploading" | "done" | "error";
  progress: number;
  error?: string;
}

interface ComplaintEvidencePanelProps {
  complaintId: string;
  referenceNo: string;
  uploadSession: ComplaintUploadSession | null;
  sessionExpired: boolean;
  onBack: () => void;
  onFinish: () => void;
}

const ACCEPT_HINT = "PDF, DOCX, JPG/PNG, MP4";

export function ComplaintEvidencePanel({
  complaintId,
  referenceNo,
  uploadSession,
  sessionExpired,
  onBack,
  onFinish,
}: ComplaintEvidencePanelProps) {
  const t = useTranslations("complaintSubmit");
  const inputRef = useRef<HTMLInputElement>(null);
  const [panelState, setPanelState] = useState<EvidencePanelState>("idle");
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [notes, setNotes] = useState("");
  const [globalError, setGlobalError] = useState<
    | { kind: "fileTooLarge"; name: string }
    | { kind: "partialFailure" }
    | null
  >(null);

  const globalErrorMessage = globalError
    ? globalError.kind === "fileTooLarge"
      ? t("evidence.fileTooLarge", { name: globalError.name })
      : t("evidence.partialFailure")
    : null;

  const addFiles = useCallback(
    (incoming: FileList | null) => {
      if (!incoming?.length || sessionExpired) return;
      const maxFiles = uploadSession?.maxFiles ?? 5;
      const maxBytes = uploadSession?.maxBytesPerFile ?? 25 * 1024 * 1024;

      setFiles((prev) => {
        const remaining = maxFiles - prev.length;
        if (remaining <= 0) return prev;

        const next: FileEntry[] = [];
        for (let i = 0; i < Math.min(incoming.length, remaining); i++) {
          const file = incoming[i];
          if (file.size > maxBytes) {
            setGlobalError({ kind: "fileTooLarge", name: file.name });
            continue;
          }
          next.push({
            id: `${file.name}-${file.size}-${Date.now()}-${i}`,
            file,
            status: "pending",
            progress: 0,
          });
        }
        return [...prev, ...next];
      });
    },
    [sessionExpired, uploadSession],
  );

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const uploadAll = async () => {
    if (!uploadSession?.token || files.length === 0) {
      onFinish();
      return;
    }

    setPanelState("uploading");
    setGlobalError(null);

    let hadError = false;
    const updated = [...files];

    for (let i = 0; i < updated.length; i++) {
      const entry = updated[i];
      if (entry.status === "done") continue;

      updated[i] = { ...entry, status: "uploading", progress: 30 };
      setFiles([...updated]);

      try {
        await uploadComplaintEvidence(
          complaintId,
          uploadSession.token,
          entry.file,
        );
        updated[i] = { ...entry, status: "done", progress: 100 };
      } catch (err) {
        hadError = true;
        const message =
          err instanceof ApiError ? err.message : t("evidence.uploadFailed");
        updated[i] = {
          ...entry,
          status: "error",
          progress: 0,
          error: message,
        };
      }
      setFiles([...updated]);
    }

    if (hadError) {
      setGlobalError({ kind: "partialFailure" });
      setPanelState("idle");
    } else {
      setPanelState("complete");
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addFiles(e.dataTransfer.files);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  if (sessionExpired) {
    return (
      <div className="mx-auto max-w-3xl rounded-none border border-border-standard bg-surface p-8 animate-fade-in-up">
        <p className="text-body text-danger" role="alert">
          {t("evidence.sessionExpired")}
        </p>
        <p className="mt-2 text-body-sm text-text-secondary">
          {t("evidence.sessionExpiredHint", { reference: referenceNo })}
        </p>
        <div className="mt-6">
          <Button type="button" variant="secondary" onClick={onFinish}>
            {t("evidence.done")}
          </Button>
        </div>
      </div>
    );
  }

  if (panelState === "complete") {
    return (
      <div className="mx-auto max-w-3xl rounded-none border border-border-standard bg-surface p-8 md:p-10 animate-fade-in-up">
        <div className="flex flex-col items-center text-center" aria-live="polite">
          <CheckCircle2 className="mb-4 h-14 w-14 text-success animate-scale-in" aria-hidden />
          <h2 className="mb-2 text-h2 font-semibold text-on-surface tracking-tight">
            {t("evidence.completeTitle")}
          </h2>
          <p className="mb-6 max-w-md text-body text-text-secondary leading-relaxed">
            {t("evidence.completeBody", { reference: referenceNo })}
          </p>
          {files.length > 0 ? (
            <ul className="mb-8 w-full space-y-2 text-left">
              {files.map((f) => (
                <li
                  key={f.id}
                  className="flex items-center gap-3 rounded-none border border-border-standard bg-surface-bright p-3.5"
                >
                  <FileText className="h-5 w-5 text-text-secondary" aria-hidden />
                  <span className="text-body-sm font-semibold">{f.file.name}</span>
                  <span className="ml-auto text-label text-success">
                    {t("evidence.uploaded")}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
          <div className="flex flex-wrap justify-center gap-4">
            <Button type="button" onClick={onFinish}>
              {t("evidence.done")}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl animate-fade-in-up">
      <div className="mb-8">
        <h1 className="mb-2 text-h2 font-semibold text-on-surface tracking-tight">
          {t("evidence.title")}
        </h1>
        <p className="text-body text-text-secondary">{t("evidence.intro")}</p>
        <p className="mt-2 text-body-sm text-text-secondary">
          {t("evidence.reference", { reference: referenceNo })}
        </p>
      </div>

      <div className="rounded-none border border-border-standard bg-surface p-6 shadow-sm md:p-8">
        <div
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
          }}
          onClick={() => inputRef.current?.click()}
          onDrop={onDrop}
          onDragOver={onDragOver}
          className="mb-8 flex cursor-pointer flex-col items-center justify-center rounded-none border-2 border-dashed border-border-standard bg-surface-container-low p-8 text-center transition-colors duration-200 hover:border-primary hover:bg-surface-container-high"
        >
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-none bg-brand-surface text-primary">
            <Upload className="h-8 w-8" aria-hidden />
          </div>
          <h3 className="mb-2 text-h3 font-semibold text-on-surface">
            {t("evidence.dropTitle")}
          </h3>
          <p className="mb-4 text-body-sm text-text-secondary">
            {t("evidence.dropHint")}
          </p>
          <p className="text-overline font-semibold uppercase tracking-wider text-text-placeholder">
            {ACCEPT_HINT} · {t("evidence.maxSize")}
          </p>
          <input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => addFiles(e.target.files)}
          />
        </div>

        {files.length > 0 ? (
          <div className="mb-8 space-y-3">
            <h4 className="text-label font-semibold text-on-surface">
              {t("evidence.attached")}
            </h4>
            {files.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between gap-3 rounded-none border border-border-standard bg-surface-bright p-3.5 animate-fade-in-up"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  {entry.file.type.startsWith("image/") ? (
                    <ImageIcon className="h-5 w-5 shrink-0 text-text-secondary" aria-hidden />
                  ) : (
                    <FileText className="h-5 w-5 shrink-0 text-text-secondary" aria-hidden />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-body-sm font-semibold">
                      {entry.file.name}
                    </p>
                    {entry.status === "uploading" ? (
                      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-none bg-surface-container-highest">
                        <div
                          className="h-full rounded-none bg-primary transition-[width]"
                          style={{ width: `${entry.progress}%` }}
                        />
                      </div>
                    ) : entry.error ? (
                      <p className="text-overline text-danger mt-0.5">{entry.error}</p>
                    ) : (
                      <p className="text-overline text-text-placeholder mt-0.5">
                        {(entry.file.size / (1024 * 1024)).toFixed(1)} MB
                      </p>
                    )}
                  </div>
                </div>
                {entry.status !== "uploading" ? (
                  <button
                    type="button"
                    onClick={() => removeFile(entry.id)}
                    className="cursor-pointer p-1 text-text-secondary transition-colors duration-200 hover:text-danger"
                    aria-label={t("evidence.removeFile")}
                  >
                    {entry.status === "error" ? (
                      <X className="h-5 w-5" aria-hidden />
                    ) : (
                      <Trash2 className="h-5 w-5" aria-hidden />
                    )}
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}

        <div className="mb-8">
          <label
            htmlFor="evidence-notes"
            className="mb-1 block text-label font-semibold text-on-surface"
          >
            {t("evidence.notesLabel")}
          </label>
          <textarea
            id="evidence-notes"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t("evidence.notesPlaceholder")}
            className="w-full rounded-none border border-border-standard p-3.5 text-body focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <p className="mt-1 text-body-sm text-text-placeholder">
            {t("evidence.notesHint")}
          </p>
        </div>

        {globalErrorMessage ? (
          <p className="mb-4 text-sm text-danger animate-fade-in-up" role="alert" aria-live="polite">
            {globalErrorMessage}
          </p>
        ) : null}

        <div className="flex flex-col-reverse items-center justify-between gap-4 border-t border-border-standard pt-6 md:flex-row">
          <Button
            type="button"
            variant="secondary"
            onClick={onBack}
            disabled={panelState === "uploading"}
            className="w-full md:w-auto"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            {t("actions.back")}
          </Button>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Button
              type="button"
              variant="secondary"
              onClick={onFinish}
              disabled={panelState === "uploading"}
            >
              {t("evidence.skip")}
            </Button>
            <Button
              type="button"
              onClick={uploadAll}
              disabled={panelState === "uploading" || files.length === 0}
            >
              {panelState === "uploading"
                ? t("evidence.uploading")
                : t("evidence.submit")}
              <Send className="h-4 w-4" aria-hidden />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
