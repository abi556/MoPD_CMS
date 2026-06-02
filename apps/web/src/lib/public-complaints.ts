import { apiPost, apiUpload } from "@/lib/api-client";

export interface ComplaintUploadSession {
  token: string;
  expiresAt: string;
  complaintId: string;
  maxFiles: number;
  maxBytesPerFile: number;
}

export interface CreatePublicComplaintInput {
  subject: string;
  description: string;
  channel: "WEB";
  consentGiven: true;
  locale: "en" | "am";
  complainantName?: string;
  complainantEmail?: string;
  complainantPhone?: string;
  requestUploadSession: true;
}

export interface CreatePublicComplaintResult {
  id: string;
  referenceNo: string;
  uploadSession: ComplaintUploadSession | null;
}

export async function createPublicComplaint(
  input: CreatePublicComplaintInput,
): Promise<CreatePublicComplaintResult> {
  return apiPost<CreatePublicComplaintResult>("/complaints", input, {
    auth: false,
  });
}

export async function uploadComplaintEvidence(
  complaintId: string,
  uploadToken: string,
  file: File,
): Promise<void> {
  const formData = new FormData();
  formData.append("uploadToken", uploadToken);
  formData.append("file", file);
  await apiUpload(`/complaints/${complaintId}/evidence`, formData, {
    auth: false,
  });
}
