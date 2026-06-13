"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { apiPost, ApiError } from "@/lib/api-client";
import type { MfaEnrollResponse, SessionUser } from "@/lib/auth/session-types";
import {
  fetchMfaStatus,
  skipMfaEnrollment,
  type MfaStatus,
} from "@/lib/auth/mfa-api";
import { resolvePostLoginPath } from "@/lib/auth/post-login-redirect";
import { resolveStaffOnboardingPath } from "@/lib/auth/staff-onboarding";
import { staffRoutes } from "@/lib/staff/routes";
import { resolveMfaEnrollCanSkip } from "@/lib/auth/mfa-policy";
import { useSession } from "@/components/providers/auth-provider";
import { AuthFieldInput } from "@/components/forms/auth-field-input";
import { Button } from "@/components/ui/button";

export function MfaEnrollForm() {
  const t = useTranslations("auth");
  const router = useRouter();
  const { refreshSession } = useSession();
  const [enrollment, setEnrollment] = useState<MfaEnrollResponse | null>(null);
  const [mfaStatus, setMfaStatus] = useState<MfaStatus | null>(null);
  const [profile, setProfile] = useState<SessionUser | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [confirming, setConfirming] = useState(false);
  const [skipping, setSkipping] = useState(false);

  const fieldClass =
    "min-h-12 w-full rounded-full border border-border-standard bg-white py-2.5 px-4 text-center text-lg tracking-[0.3em] text-on-surface transition-colors duration-200 placeholder:text-text-placeholder focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30";

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await refreshSession();
        const [status, data] = await Promise.all([
          fetchMfaStatus(),
          apiPost<MfaEnrollResponse>("/auth/mfa/enroll"),
        ]);
        if (cancelled) return;
        if (status.enrolled) {
          router.replace("/dashboard");
          return;
        }
        setProfile(me);
        setMfaStatus(status);
        setEnrollment(data);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError ? err.message : t("mfaEnrollError"),
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshSession, router, t]);

  async function onConfirm(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setConfirming(true);
    setError(undefined);
    try {
      await apiPost<{ message: string }>("/auth/mfa/confirm", { code });
      const updated = await refreshSession();
      router.replace(
        updated ? resolveStaffOnboardingPath(updated) : "/dashboard",
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("mfaConfirmError"));
    } finally {
      setConfirming(false);
    }
  }

  async function onSkip() {
    setSkipping(true);
    setError(undefined);
    try {
      await skipMfaEnrollment();
      const updated = await refreshSession();
      router.replace(
        updated ? resolvePostLoginPath(updated) : staffRoutes.home,
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("mfaSkipError"));
    } finally {
      setSkipping(false);
    }
  }

  if (error && !enrollment) {
    return (
      <div>
        <h1 className="font-display text-4xl font-semibold tracking-tight text-on-surface">
          {t("mfaEnrollTitle")}
        </h1>
        <p className="mt-4 text-sm text-danger" role="alert">
          {error}
        </p>
      </div>
    );
  }

  if (!enrollment) {
    return (
      <div>
        <h1 className="font-display text-4xl font-semibold tracking-tight text-on-surface">
          {t("mfaEnrollTitle")}
        </h1>
        <p className="mt-2 text-sm text-text-secondary">{t("mfaEnrollLoading")}</p>
      </div>
    );
  }

  const canSkip = resolveMfaEnrollCanSkip({
    enrolled: mfaStatus?.enrolled ?? profile?.mfaEnrolled,
  });

  const subtitle = t("mfaEnrollSubtitle");

  return (
    <div>
      <h1 className="font-display text-4xl font-semibold tracking-tight text-on-surface">
        {t("mfaEnrollTitle")}
      </h1>
      <p className="mt-2 text-sm text-text-secondary">{subtitle}</p>

      <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={enrollment.qrCodeDataUrl}
          alt={t("mfaQrAlt")}
          width={180}
          height={180}
          className="rounded-lg border border-border-standard bg-white p-2"
        />
        <div className="text-sm">
          <p className="font-medium text-on-surface">{t("mfaSecretLabel")}</p>
          <code className="mt-1 block break-all text-text-secondary">
            {enrollment.secret}
          </code>
        </div>
      </div>

      <div className="mt-6">
        <p className="text-sm font-medium text-on-surface">{t("mfaBackupCodesTitle")}</p>
        <ul className="mt-2 grid grid-cols-2 gap-1 font-mono text-sm text-text-secondary">
          {enrollment.backupCodes.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      </div>

      <form className="mt-10 flex flex-col gap-5" onSubmit={onConfirm}>
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
            aria-describedby={error ? "mfa-enroll-error" : undefined}
            className={`${fieldClass} ${error ? "border-danger" : ""}`}
          />
          {error ? (
            <p id="mfa-enroll-error" className="text-xs text-danger" role="alert">
              {error}
            </p>
          ) : null}
        </div>

        <Button
          type="submit"
          variant="brand"
          size="lg"
          fullWidth
          disabled={confirming || skipping}
          className="mt-1"
        >
          {confirming ? "…" : t("mfaEnrollConfirm")}
        </Button>

        {canSkip ? (
          <>
            <Button
              type="button"
              variant="secondary"
              size="lg"
              fullWidth
              disabled={confirming || skipping}
              onClick={onSkip}
            >
              {skipping ? "…" : t("mfaEnrollSkip")}
            </Button>
            <p className="text-center text-xs text-text-secondary">
              {t("mfaEnrollSkipHint")}
            </p>
          </>
        ) : null}
      </form>
    </div>
  );
}
