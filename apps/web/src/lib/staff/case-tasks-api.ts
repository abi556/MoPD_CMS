import { apiGet, apiPatch, apiPost } from "@/lib/api-client";

export type CaseTaskStatus = "OPEN" | "IN_PROGRESS" | "DONE" | "CANCELLED";

export interface CaseTaskItem {
  id: string;
  complaintId: string;
  assigneeUserId: string;
  createdByUserId: string;
  title: string;
  status: CaseTaskStatus;
  dueAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCaseTaskPayload {
  title: string;
  assigneeUserId: string;
  dueAt?: string;
}

export interface UpdateCaseTaskPayload {
  status?: CaseTaskStatus;
  title?: string;
  assigneeUserId?: string;
  dueAt?: string;
}

export async function listCaseTasks(complaintId: string): Promise<CaseTaskItem[]> {
  return apiGet<CaseTaskItem[]>(`/complaints/${complaintId}/tasks`);
}

export async function createCaseTask(
  complaintId: string,
  payload: CreateCaseTaskPayload,
): Promise<CaseTaskItem> {
  return apiPost<CaseTaskItem>(`/complaints/${complaintId}/tasks`, payload);
}

export async function updateCaseTask(
  complaintId: string,
  taskId: string,
  payload: UpdateCaseTaskPayload,
): Promise<CaseTaskItem> {
  return apiPatch<CaseTaskItem>(
    `/complaints/${complaintId}/tasks/${taskId}`,
    payload,
  );
}
