import { apiGet, apiPost } from "@/lib/api-client";

export interface CaseNoteItem {
  id: string;
  complaintId: string;
  authorUserId: string;
  body: string;
  visibility: "INTERNAL" | "EXTERNAL";
  createdAt: string;
}

export async function listCaseNotes(complaintId: string): Promise<CaseNoteItem[]> {
  return apiGet<CaseNoteItem[]>(`/complaints/${complaintId}/notes`);
}

export async function createCaseNote(
  complaintId: string,
  payload: { body: string; visibility?: "INTERNAL" | "EXTERNAL" },
): Promise<CaseNoteItem> {
  return apiPost<CaseNoteItem>(`/complaints/${complaintId}/notes`, payload);
}
