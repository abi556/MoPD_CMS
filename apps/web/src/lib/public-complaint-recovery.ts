import { apiPost } from "@/lib/api-client";

export type RecoveryChannel = "email" | "sms";

export interface RecoveryRequestInput {
  channel: RecoveryChannel;
  email?: string;
  phone?: string;
  locale: "en" | "am";
}

export interface RecoveredReference {
  referenceNo: string;
  submittedAt: string;
}

export interface RecoveryVerifyResult {
  references: RecoveredReference[];
}

export async function requestRecoveryOtp(
  input: RecoveryRequestInput,
): Promise<void> {
  await apiPost<void>("/complaints/recovery/request", input, { auth: false });
}

export async function verifyRecoveryOtp(
  input: RecoveryRequestInput & { code: string },
): Promise<RecoveryVerifyResult> {
  return apiPost<RecoveryVerifyResult>("/complaints/recovery/verify", input, {
    auth: false,
  });
}

export interface CreateRecoveryInquiryInput {
  subjectFragment: string;
  submittedDateGregorian?: string;
  submittedDateEthiopian?: string;
  categoryId?: string;
  orgUnitId?: string;
  contactEmail: string;
  additionalNotes?: string;
  locale: "en" | "am";
}

export interface CreateRecoveryInquiryResult {
  inquiryId: string;
  message: string;
}

export async function createRecoveryInquiry(
  input: CreateRecoveryInquiryInput,
): Promise<CreateRecoveryInquiryResult> {
  return apiPost<CreateRecoveryInquiryResult>(
    "/complaints/recovery/inquiries",
    input,
    { auth: false },
  );
}
