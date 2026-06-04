import { apiGet, apiPost, apiUpload } from "@/lib/api-client";
import {
  getCachedComplaintFormOptions,
  setCachedComplaintFormOptions,
} from "@/lib/complaint-form-options-cache";

export interface ComplaintUploadSession {
  token: string;
  expiresAt: string;
  complaintId: string;
  maxFiles: number;
  maxBytesPerFile: number;
}

export interface ComplaintFormOptionItem {
  id: string;
  code: string;
  nameEn: string;
  nameAm: string | null;
}

export interface ComplaintFormOptions {
  categories: ComplaintFormOptionItem[];
  orgUnits: ComplaintFormOptionItem[];
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
  categoryId?: string;
  orgUnitId?: string;
  requestUploadSession: true;
}

export interface CreatePublicComplaintResult {
  id: string;
  referenceNo: string;
  uploadSession: ComplaintUploadSession | null;
  ackEmailQueued: boolean;
}

export function optionLabel(
  item: ComplaintFormOptionItem,
  locale: "en" | "am",
): string {
  if (locale === "am" && item.nameAm) {
    return item.nameAm;
  }
  return item.nameEn;
}

export async function fetchComplaintFormOptions(): Promise<ComplaintFormOptions> {
  return apiGet<ComplaintFormOptions>("/complaints/form-options", {
    auth: false,
  });
}

export function getComplaintFormOptionsFromCache(): ComplaintFormOptions | null {
  return getCachedComplaintFormOptions();
}

/** Loads form options with session cache; pass `force` to bypass cache on retry. */
export async function loadComplaintFormOptions(options?: {
  force?: boolean;
}): Promise<ComplaintFormOptions> {
  if (!options?.force) {
    const cached = getCachedComplaintFormOptions();
    if (cached) {
      return cached;
    }
  }
  const data = await fetchComplaintFormOptions();
  setCachedComplaintFormOptions(data);
  return data;
}

export interface ComplaintTrackPayload {
  referenceNo: string;
  status: string;
  subject: string;
  submittedAt: string;
}

export async function trackComplaintByReference(
  referenceNo: string,
): Promise<ComplaintTrackPayload> {
  const encoded = encodeURIComponent(referenceNo.trim());
  return apiGet<ComplaintTrackPayload>(`/complaints/track/${encoded}`, {
    auth: false,
  });
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
