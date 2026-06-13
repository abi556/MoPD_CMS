"use client";

import { FormEvent, useEffect, useState } from "react";
import { Mail } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { apiPost, ApiError } from "@/lib/api-client";
import { staffRoutes } from "@/lib/staff/routes";
import { Button } from "@/components/ui/button";
import { AuthFieldInput } from "@/components/forms/auth-field-input";

type ForgotPasswordResponse = { message: string };

export function ForgotPasswordForm() {
  const t = useTranslations("auth");
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [successMessage, setSuccessMessage] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fromQuery = searchParams.get("email");
    if (fromQuery) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- prefill from query
      setEmail(fromQuery);
    }
  }, [searchParams]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(undefined);
    setSuccessMessage(undefined);
    try {
      const data = await apiPost<ForgotPasswordResponse>(
        "/auth/forgot-password",
        { email },
        { auth: false },
      );
      setSuccessMessage(data.message);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : t("forgotPasswordErrorGeneric"),
      );
    } finally {
      setLoading(false);
    }
  }

  const fieldClass =
    "min-h-12 w-full rounded-full border border-border-standard bg-white py-2.5 pl-11 pr-4 text-sm text-on-surface transition-colors duration-200 placeholder:text-text-placeholder focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30";

  if (successMessage) {
    return (
      <div>
        <h1 className="font-display text-4xl font-semibold tracking-tight text-on-surface">
          {t("forgotPasswordSuccessTitle")}
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
        {t("forgotPasswordTitle")}
      </h1>
      <p className="mt-2 text-sm text-text-secondary">
        {t("forgotPasswordSubtitle")}
      </p>

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
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "forgot-password-error" : undefined}
              className={`${fieldClass} ${error ? "border-danger" : ""}`}
            />
          </div>
          {error ? (
            <p
              id="forgot-password-error"
              className="text-xs text-danger"
              role="alert"
            >
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
          {loading ? "…" : t("forgotPasswordSubmit")}
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
