export const TEMPLATE_VARIABLE_HINTS: Record<string, string[]> = {
  password_reset: ["resetUrl", "expiresInMinutes"],
  complaint_submitted_ack: ["referenceNo", "trackUrl"],
  complaint_transition: ["referenceNo", "status", "trackUrl"],
  complaint_recovery_otp: ["otpCode", "expiresInMinutes"],
  complaint_recovery_resolved: ["referenceNo", "trackUrl"],
  complaint_recovery_inquiry_received: ["subjectFragment"],
  complaint_recovery_inquiry_rejected: ["subjectFragment"],
};

export function getTemplateVariableHints(key: string): string[] {
  return TEMPLATE_VARIABLE_HINTS[key] ?? [];
}

export function formatVariableHint(name: string): string {
  return `{{${name}}}`;
}
