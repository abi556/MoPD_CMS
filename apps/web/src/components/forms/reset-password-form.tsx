"use client";

import { useCallback, useState, type FormEvent } from "react";
import { Lock } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { apiPost, ApiError } from "@/lib/api-client";
import { staffRoutes } from "@/lib/staff/routes";
import { Button } from "@/components/ui/button";
import { AuthFieldInput } from "@/components/forms/auth-field-input";

export function ResetPasswordForm() {
  const t = useTranslations("auth");
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [successMessage, setSuccessMessage] = useState<string | undefined>();

  const fieldClass =
    "min-h-12 w-full rounded-full border border-border-standard bg-white py-2.5 pl-11 pr-4 text-sm text-on-surface transition-colors duration-200 placeholder:text-text-placeholder focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30";

  const onSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      if (!token) {
        setError(t("resetPasswordMissingTokenBody"));
        return;
      }

      if (password !== confirm) {
        setError(t("resetPasswordMismatch"));
        return;
      }

      setLoading(true);
      setError(undefined);

      try {
        const data = await apiPost<{ message: string }>(
          "/auth/reset-password",
          { token, newPassword: password },
          { auth: false },
        );
        setSuccessMessage(data.message ?? t("resetPasswordSuccessBody"));
      } catch (err) {
        setError(
          err instanceof ApiError ? err.message : t("resetPasswordErrorGeneric"),
        );
      } finally {
        setLoading(false);
      }
    },
    [token, password, confirm, t],
  );

  if (!token) {
    return (
      <div>
        <h1 className="font-display text-4xl font-semibold tracking-tight text-on-surface">
          {t("resetPasswordMissingTokenTitle")}
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-text-secondary">
          {t("resetPasswordMissingTokenBody")}
        </p>
        <div className="mt-8">
          <Link
            href={staffRoutes.auth.forgotPassword}
            className="text-sm font-semibold text-on-surface underline-offset-4 hover:underline"
          >
            {t("forgotPasswordTitle")}
          </Link>
        </div>
      </div>
    );
  }

  if (successMessage) {
    return (
      <div>
        <h1 className="font-display text-4xl font-semibold tracking-tight text-on-surface">
          {t("resetPasswordSuccessTitle")}
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-text-secondary">
          {successMessage}
        </p>
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

  return (
    <div>
      <h1 className="font-display text-4xl font-semibold tracking-tight text-on-surface">
        {t("resetPasswordTitle")}
      </h1>
      <p className="mt-2 text-sm text-text-secondary">{t("resetPasswordSubtitle")}</p>

      <form className="mt-10 flex flex-col gap-5" onSubmit={onSubmit}>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-sm font-medium text-on-surface">
            {t("newPassword")}
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
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={fieldClass}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="confirm-password"
            className="text-sm font-medium text-on-surface"
          >
            {t("confirmPassword")}
          </label>
          <div className="relative">
            <Lock
              className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-placeholder"
              aria-hidden
            />
            <AuthFieldInput
              id="confirm-password"
              name="confirm-password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "reset-password-error" : undefined}
              className={`${fieldClass} ${error ? "border-danger" : ""}`}
            />
          </div>
          {error ? (
            <p id="reset-password-error" className="text-xs text-danger" role="alert">
              {error}
            </p>
          ) : null}
        </div>

        <Button
          type="submit"
          variant="brand"
          size="lg"
          fullWidth
          disabled={loading}
          className="mt-1"
        >
          {loading ? "…" : t("resetPasswordSubmit")}
        </Button>
      </form>

      <div className="mt-8 text-sm">
        <Link
          href={staffRoutes.auth.login}
          className="font-semibold text-on-surface underline-offset-4 hover:underline"
        >
          {t("backToSignIn")}
        </Link>
      </div>
    </div>
  );
}
