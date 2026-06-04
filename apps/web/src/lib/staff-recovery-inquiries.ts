import { apiGet, apiPatch } from "@/lib/api-client";

export type RecoveryInquiryStatus =
  | "PENDING"
  | "IN_REVIEW"
  | "RESOLVED"
  | "REJECTED";

export interface RecoveryInquiryItem {
  id: string;
  status: RecoveryInquiryStatus;
  locale: string;
  subjectFragment: string;
  submittedDateGregorian: string | null;
  submittedDateEthiopian: string | null;
  categoryId: string | null;
  orgUnitId: string | null;
  contactEmail: string;
  additionalNotes: string | null;
  matchedComplaintId: string | null;
  resolvedReferenceNo: string | null;
  createdAt: string;
}

export interface ComplaintCandidate {
  id: string;
  referenceNo: string;
  subject: string;
  submittedAt: string;
  status: string;
  complainantEmail: string | null;
}

export async function listRecoveryInquiries(status?: RecoveryInquiryStatus) {
  const query = status ? `?status=${status}` : "";
  return apiGet<RecoveryInquiryItem[]>(
    `/complaints/recovery/inquiries${query}`,
    { auth: true },
  );
}

export async function getRecoveryInquiryCandidates(inquiryId: string) {
  return apiGet<ComplaintCandidate[]>(
    `/complaints/recovery/inquiries/${inquiryId}/candidates`,
    { auth: true },
  );
}

export async function resolveRecoveryInquiry(
  inquiryId: string,
  body: {
    status: RecoveryInquiryStatus;
    matchedComplaintId?: string;
    resolvedReferenceNo?: string;
  },
) {
  return apiPatch<RecoveryInquiryItem>(
    `/complaints/recovery/inquiries/${inquiryId}`,
    body,
    { auth: true },
  );
}
