import { apiGet, apiPatch, apiPost, apiRequest } from "@/lib/api-client";

export type MfaMethod = "totp" | "email";

export interface MfaStatus {
  enrolled: boolean;
  method: MfaMethod | null;
  provider: "totp";
  policy: "optional" | "required";
  mustEnroll: boolean;
  totpOnly: boolean;
  canSkipEnroll: boolean;
  backupCodesRemaining: number;
}

export async function fetchMfaStatus(): Promise<MfaStatus> {
  return apiGet<MfaStatus>("/auth/mfa/status");
}

export async function skipMfaEnrollment(): Promise<{ message: string }> {
  return apiPost<{ message: string }>("/auth/mfa/skip");
}

export async function switchMfaMethod(method: MfaMethod): Promise<{ message: string }> {
  return apiPatch<{ message: string }>("/auth/mfa/method", { method });
}

export async function disableMfa(password: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>("/auth/mfa", {
    method: "DELETE",
    body: { password },
  });
}

export async function regenerateBackupCodes(
  password: string,
): Promise<{ backupCodes: string[] }> {
  return apiPost<{ backupCodes: string[] }>("/auth/mfa/backup-codes/regenerate", {
    password,
  });
}
