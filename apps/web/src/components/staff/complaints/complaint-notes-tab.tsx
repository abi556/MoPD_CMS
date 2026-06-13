"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ApiError } from "@/lib/api-client";
import {
  createCaseNote,
  listCaseNotes,
  type CaseNoteItem,
} from "@/lib/staff/case-notes-api";
import { hasPermission } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/ui/empty-state";

interface ComplaintNotesTabProps {
  complaintId: string;
  permissions: string[];
}

export function ComplaintNotesTab({
  complaintId,
  permissions,
}: ComplaintNotesTabProps) {
  const t = useTranslations("complaints.notes");
  const canRead = hasPermission(permissions, "case:read");
  const canWrite = hasPermission(permissions, "case:write");

  const [notes, setNotes] = useState<CaseNoteItem[]>([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const fetchNotes = useCallback(async () => {
    if (!canRead) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await listCaseNotes(complaintId);
      setNotes(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load notes");
    } finally {
      setLoading(false);
    }
  }, [complaintId, canRead]);

  useEffect(() => {
    void fetchNotes();
  }, [fetchNotes]);

  const handleSubmit = async () => {
    if (!body.trim()) return;
    setSubmitting(true);
    setError(undefined);
    try {
      await createCaseNote(complaintId, { body: body.trim() });
      setBody("");
      await fetchNotes();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save note");
    } finally {
      setSubmitting(false);
    }
  };

  if (!canRead) {
    return (
      <EmptyState
        title={t("emptyTitle")}
        description={t("emptyDescription")}
      />
    );
  }

  return (
    <div className="space-y-6">
      {canWrite ? (
        <div className="rounded-xl border border-staff-border bg-staff-surface p-4">
          <Textarea
            label={t("body")}
            name="noteBody"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
          />
          {error ? (
            <p className="mt-2 text-sm text-red-600" role="alert">
              {error}
            </p>
          ) : null}
          <Button
            className="mt-3 min-h-11 cursor-pointer"
            onClick={() => void handleSubmit()}
            disabled={submitting || !body.trim()}
          >
            {t("submit")}
          </Button>
        </div>
      ) : null}

      {loading ? (
        <p className="text-sm text-staff-text-muted">Loading…</p>
      ) : notes.length === 0 ? (
        <EmptyState
          title={t("emptyTitle")}
          description={t("emptyDescription")}
        />
      ) : (
        <ul className="space-y-3">
          {notes.map((note) => (
            <li
              key={note.id}
              className="rounded-xl border border-staff-border bg-staff-surface p-4"
            >
              <p className="whitespace-pre-wrap text-sm text-staff-text">
                {note.body}
              </p>
              <p className="mt-2 text-xs text-staff-text-muted">
                {t("author")}: {note.authorUserId} ·{" "}
                {new Date(note.createdAt).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
