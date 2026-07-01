"use client";

import { FormEvent, useEffect, useState } from "react";
import { Lock, Mail } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useRouter } from "@/i18n/navigation";
import { ApiError } from "@/lib/api-client";
import { storeMfaChallenge } from "@/lib/auth/mfa-storage";
import { resolvePostLoginPath } from "@/lib/auth/post-login-redirect";
import { resolveStaffOnboardingPath } from "@/lib/auth/staff-onboarding";
import { staffRoutes } from "@/lib/staff/routes";
import { useSession } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { AuthFieldInput } from "@/components/forms/auth-field-input";

const REMEMBER_EMAIL_KEY = "mopd_staff_login_email";

export function LoginForm() {
  const t = useTranslations("auth");
  const { login, refreshSession } = useSession();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberEmail, setRememberEmail] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(REMEMBER_EMAIL_KEY);
      if (stored) {
         
        setEmail(stored);
        setRememberEmail(true);
      }
    } catch {
      /* ignore storage errors */
    }
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(undefined);
    try {
      const result = await login(email, password);
      try {
        if (rememberEmail) {
          localStorage.setItem(REMEMBER_EMAIL_KEY, email);
        } else {
          localStorage.removeItem(REMEMBER_EMAIL_KEY);
        }
      } catch {
        /* ignore */
      }
      if (result.kind === "mfa") {
        storeMfaChallenge(result.mfaToken, result.mustChangePassword);
        router.replace(staffRoutes.auth.mfaVerify);
        return;
      }
      if (result.mustChangePassword) {
        router.replace(staffRoutes.auth.changePassword);
        return;
      }
      const sessionUser = await refreshSession();
      router.replace(
        sessionUser
          ? resolveStaffOnboardingPath(sessionUser)
          : resolvePostLoginPath(result.user),
      );
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : t("loginErrorGeneric"),
      );
    } finally {
      setLoading(false);
    }
  }

  const fieldClass =
    "min-h-12 w-full rounded-full border border-border-standard bg-white py-2.5 pl-11 pr-4 text-sm text-on-surface transition-colors duration-200 placeholder:text-text-placeholder focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30";

  return (
    <div>
      <h1 className="font-display text-4xl font-semibold tracking-tight text-on-surface">
        {t("loginTitle")}
      </h1>
      <p className="mt-2 text-sm text-text-secondary">{t("loginSubtitle")}</p>

      <form className="mt-10 flex flex-col gap-5" onSubmit={onSubmit}>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm font-medium text-on-surface">
            {t("email")}
          </label>
          <div className="relative">
            <Mail
              className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-placeholder"
              aria-hidden
            />
            <AuthFieldInput
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={fieldClass}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="password"
            className="text-sm font-medium text-on-surface"
          >
            {t("password")}
          </label>
          <div className="relative">
            <Lock
              className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-placeholder"
              aria-hidden
            />
            <AuthFieldInput
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "login-error" : undefined}
              className={`${fieldClass} ${error ? "border-danger" : ""}`}
            />
          </div>
          {error ? (
            <p id="login-error" className="text-xs text-danger" role="alert">
              {error}
            </p>
          ) : null}
        </div>

        <label className="flex cursor-pointer items-center gap-2.5 text-sm text-text-secondary">
          <input
            type="checkbox"
            checked={rememberEmail}
            onChange={(e) => setRememberEmail(e.target.checked)}
            className="h-4 w-4 rounded border-border-standard text-primary focus-visible:ring-primary"
          />
          {t("rememberEmail")}
        </label>

        <Button
          type="submit"
          variant="brand"
          size="lg"
          fullWidth
          disabled={loading}
          className="mt-1"
        >
          {loading ? "…" : t("signIn")}
        </Button>
      </form>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 text-sm">
        <p className="text-text-secondary">
          {t("publicPortalPrompt")}{" "}
          <Link
            href="/"
            className="font-semibold text-on-surface underline-offset-4 hover:underline"
          >
            {t("publicPortalLink")}
          </Link>
        </p>
        {error ? (
          <Link
            href={
              email
                ? `${staffRoutes.auth.forgotPassword}?email=${encodeURIComponent(email)}`
                : staffRoutes.auth.forgotPassword
            }
            className="font-semibold text-on-surface underline-offset-4 hover:underline"
          >
            {t("forgotPassword")}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
