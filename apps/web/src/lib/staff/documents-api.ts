import { apiDelete, apiGet, apiUpload } from "@/lib/api-client";

export type DocumentScanStatus =
  | "PENDING"
  | "SCANNING"
  | "CLEAN"
  | "INFECTED"
  | "FAILED";

export interface ComplaintDocument {
  id: string;
  complaintId: string;
  ownerUserId: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  scanStatus: DocumentScanStatus;
  storageKey: string;
  scannedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentDownload {
  url: string;
  expiresAt: string;
}

export async function listComplaintDocuments(
  complaintId: string,
): Promise<ComplaintDocument[]> {
  return apiGet<ComplaintDocument[]>(`/complaints/${complaintId}/documents`);
}

export async function uploadComplaintDocument(
  complaintId: string,
  file: File,
): Promise<ComplaintDocument> {
  const formData = new FormData();
  formData.append("complaintId", complaintId);
  formData.append("file", file);
  return apiUpload<ComplaintDocument>("/documents/upload", formData);
}

export async function getDocumentDownloadUrl(
  documentId: string,
): Promise<DocumentDownload> {
  return apiGet<DocumentDownload>(`/documents/${documentId}/download`);
}

export async function deleteComplaintDocument(documentId: string): Promise<void> {
  await apiDelete(`/documents/${documentId}`);
}
