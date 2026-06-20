export interface SessionUser {
  id: string;
  email: string;
  roles: string[];
  permissions: string[];
  mustChangePassword?: boolean;
  /** Soft prompt — show MFA setup after onboarding; skippable for standard roles. */
  mustEnrollMfa?: boolean;
  /** Hard block — SuperAdmin/SystemAdmin (and org-required MFA) cannot skip. */
  requireMfaEnrollment?: boolean;
  mfaEnrolled?: boolean;
  mfaMethod?: "totp" | "email" | null;
  canSkipMfaEnroll?: boolean;
  preferredLocale?: "en" | "am" | null;
}

export interface LoginSessionPayload {
  accessToken: string;
  expiresIn: number;
  user: SessionUser;
  mustChangePassword: boolean;
}

export type LoginResult =
  | {
      kind: "session";
      accessToken: string;
      expiresIn: number;
      user: SessionUser;
      mustChangePassword: boolean;
    }
  | {
      kind: "mfa";
      mfaToken: string;
      mustChangePassword: boolean;
    };

/** @deprecated Use LoginResult */
export interface LoginResponse {
  accessToken: string;
  expiresIn: number;
  user: SessionUser;
}

export interface MfaEnrollResponse {
  qrCodeDataUrl: string;
  secret: string;
  backupCodes: string[];
}
