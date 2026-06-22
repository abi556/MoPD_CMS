const SESSION_KEY = "mopd_chat_session";

export function getOrCreateChatSessionId(): string {
  if (typeof window === "undefined") {
    return "00000000-0000-4000-8000-000000000099";
  }
  const existing = window.sessionStorage.getItem(SESSION_KEY);
  if (existing) {
    return existing;
  }
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-fallback-session`;
  window.sessionStorage.setItem(SESSION_KEY, id);
  return id;
}
