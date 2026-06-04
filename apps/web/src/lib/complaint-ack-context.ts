/** How submit acknowledgment was (or was not) delivered after complaint create. */
export type AckContext = "email" | "phone_only" | "none";

export function deriveAckContext(form: {
  complainantEmail: string;
  complainantPhone: string;
}): AckContext {
  if (form.complainantEmail.trim()) {
    return "email";
  }
  if (form.complainantPhone.trim()) {
    return "phone_only";
  }
  return "none";
}

/** Masks email for display on success screen (e.g. a***@example.com). */
export function maskEmailForDisplay(email: string): string {
  const trimmed = email.trim();
  const at = trimmed.indexOf("@");
  if (at <= 0) {
    return trimmed;
  }
  const local = trimmed.slice(0, at);
  const domain = trimmed.slice(at + 1);
  if (!domain) {
    return trimmed;
  }
  const visible = local.slice(0, 1);
  const masked =
    local.length <= 1 ? "*" : `${visible}${"*".repeat(Math.min(3, local.length - 1))}`;
  return `${masked}@${domain}`;
}
