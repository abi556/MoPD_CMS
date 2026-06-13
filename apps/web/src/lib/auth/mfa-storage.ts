const MFA_TOKEN_KEY = "mopd_mfa_token";
const MFA_MUST_CHANGE_KEY = "mopd_mfa_must_change";

export function storeMfaChallenge(mfaToken: string, mustChangePassword: boolean): void {
  try {
    sessionStorage.setItem(MFA_TOKEN_KEY, mfaToken);
    sessionStorage.setItem(MFA_MUST_CHANGE_KEY, String(mustChangePassword));
  } catch {
    /* ignore */
  }
}

export function readMfaChallenge(): {
  mfaToken: string | null;
  mustChangePassword: boolean;
} {
  try {
    const mfaToken = sessionStorage.getItem(MFA_TOKEN_KEY);
    const mustChangePassword =
      sessionStorage.getItem(MFA_MUST_CHANGE_KEY) === "true";
    return { mfaToken, mustChangePassword };
  } catch {
    return { mfaToken: null, mustChangePassword: false };
  }
}

export function clearMfaChallenge(): void {
  try {
    sessionStorage.removeItem(MFA_TOKEN_KEY);
    sessionStorage.removeItem(MFA_MUST_CHANGE_KEY);
  } catch {
    /* ignore */
  }
}
