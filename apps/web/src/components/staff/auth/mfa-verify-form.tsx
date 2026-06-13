"use client";

import { FormEvent, useEffect, useState } from "react";
import { KeyRound } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useRouter } from "@/i18n/navigation";
import { ApiError } from "@/lib/api-client";
import {
  clearMfaChallenge,
  readMfaChallenge,
} from "@/lib/auth/mfa-storage";
import { resolveStaffOnboardingPath } from "@/lib/auth/staff-onboarding";
import { staffRoutes } from "@/lib/staff/routes";
import { useSession } from "@/components/providers/auth-provider";
import { AuthFieldInput } from "@/components/forms/auth-field-input";
import { Button } from "@/components/ui/button";

type MfaMode = "totp" | "backup";

export function MfaVerifyForm() {
  const t = useTranslations("auth");
  const { verifyMfa, refreshSession } = useSession();
  const router = useRouter();
  const [challenge] = useState(() => readMfaChallenge());
  const [mode, setMode] = useState<MfaMode>("totp");
  const [code, setCode] = useState("");
  const [backupCode, setBackupCode] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  const mfaToken = challenge.mfaToken;
  const mustChangePassword = challenge.mustChangePassword;

  const fieldClass =
    "min-h-12 w-full rounded-full border border-border-standard bg-white py-2.5 pl-11 pr-4 text-sm text-on-surface transition-colors duration-200 placeholder:text-text-placeholder focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30";

  const totpFieldClass =
    "min-h-12 w-full rounded-full border border-border-standard bg-white py-2.5 px-4 text-center text-lg tracking-[0.3em] text-on-surface transition-colors duration-200 placeholder:text-text-placeholder focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30";

  useEffect(() => {
    if (!mfaToken) {
      router.replace(staffRoutes.auth.login);
    }
  }, [mfaToken, router]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!mfaToken) return;
    setLoading(true);
    setError(undefined);
    try {
      const payload = await verifyMfa(
        mfaToken,
        mode === "totp" ? { code } : { backupCode },
      );
      clearMfaChallenge();
      if (payload.mustChangePassword || mustChangePassword) {
        router.replace(staffRoutes.auth.changePassword);
        return;
      }
      const updated = await refreshSession();
      router.replace(
        updated
          ? resolveStaffOnboardingPath(updated)
          : resolveStaffOnboardingPath(payload.user),
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("mfaVerifyError"));
    } finally {
      setLoading(false);
    }
  }

  if (!mfaToken) {
    return null;
  }

  return (
    <div>
      <h1 className="font-display text-4xl font-semibold tracking-tight text-on-surface">
        {t("mfaVerifyTitle")}
      </h1>
      <p className="mt-2 text-sm text-text-secondary">{t("mfaVerifySubtitle")}</p>

      <form className="mt-10 flex flex-col gap-5" onSubmit={onSubmit}>
        <div
          className="flex rounded-full border border-border-standard bg-white p-1"
          role="tablist"
          aria-label={t("mfaVerifyTitle")}
        >
          <button
            type="button"
            role="tab"
            aria-selected={mode === "totp"}
            className={`flex-1 rounded-full py-2.5 text-sm font-medium transition-colors duration-200 ${
              mode === "totp"
                ? "bg-primary text-white shadow-sm"
                : "text-text-secondary hover:text-on-surface"
            }`}
            onClick={() => {
              setMode("totp");
              setError(undefined);
            }}
          >
            {t("mfaTotpTab")}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "backup"}
            className={`flex-1 rounded-full py-2.5 text-sm font-medium transition-colors duration-200 ${
              mode === "backup"
                ? "bg-primary text-white shadow-sm"
                : "text-text-secondary hover:text-on-surface"
            }`}
            onClick={() => {
              setMode("backup");
              setError(undefined);
            }}
          >
            {t("mfaBackupTab")}
          </button>
        </div>

        {mode === "totp" ? (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="mfa-code" className="text-sm font-medium text-on-surface">
              {t("mfaCodeLabel")}
            </label>
            <AuthFieldInput
              id="mfa-code"
              name="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "mfa-verify-error" : undefined}
              className={`${totpFieldClass} ${error ? "border-danger" : ""}`}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="mfa-backup-code"
              className="text-sm font-medium text-on-surface"
            >
              {t("mfaBackupLabel")}
            </label>
            <div className="relative">
              <KeyRound
                className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-placeholder"
                aria-hidden
              />
              <AuthFieldInput
                id="mfa-backup-code"
                name="backupCode"
                autoComplete="off"
                required
                value={backupCode}
                onChange={(e) => setBackupCode(e.target.value)}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "mfa-verify-error" : undefined}
                className={`${fieldClass} ${error ? "border-danger" : ""}`}
              />
            </div>
          </div>
        )}

        {error ? (
          <p id="mfa-verify-error" className="text-xs text-danger" role="alert">
            {error}
          </p>
        ) : null}

        <Button
          type="submit"
          variant="brand"
          size="lg"
          fullWidth
          disabled={loading}
          className="mt-1"
        >
          {loading ? "…" : t("mfaVerifySubmit")}
        </Button>
      </form>

      <div className="mt-8">
        <Link
          href={staffRoutes.auth.login}
          className="text-sm font-semibold text-on-surface underline-offset-4 hover:underline"
        >
          {t("backToSignIn")}
        </Link>
      </div>
    </div>
  );
}
