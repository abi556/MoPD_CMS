/** Normalize Ethiopian-style input to E.164 for API validation. */
export function normalizePhoneE164(raw: string): string {
  const compact = raw.replace(/[\s-]/g, "");
  if (compact.startsWith("+")) {
    return compact;
  }
  if (compact.startsWith("0")) {
    return `+251${compact.slice(1)}`;
  }
  if (compact.startsWith("251")) {
    return `+${compact}`;
  }
  return compact;
}

export function isValidE164(phone: string): boolean {
  return /^\+[1-9]\d{7,14}$/.test(phone);
}
