"use client";

import { useState, type FormEvent } from "react";
import { Lock } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { ApiError } from "@/lib/api-client";
import { resolvePostPasswordChangePath } from "@/lib/auth/staff-onboarding";
import { staffRoutes } from "@/lib/staff/routes";
import { useSession } from "@/components/providers/auth-provider";
import { AuthFieldInput } from "@/components/forms/auth-field-input";
import { Button } from "@/components/ui/button";

export function ChangePasswordForm() {
  const t = useTranslations("auth");
  const { changePassword, refreshSession } = useSession();
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  const fieldClass =
    "min-h-12 w-full rounded-full border border-border-standard bg-white py-2.5 pl-11 pr-4 text-sm text-on-surface transition-colors duration-200 placeholder:text-text-placeholder focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30";

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError(t("changePasswordMismatch"));
      return;
    }
    setLoading(true);
    setError(undefined);
    try {
      await changePassword(currentPassword, newPassword);
      const updated = await refreshSession();
      router.replace(
        updated ? resolvePostPasswordChangePath(updated) : staffRoutes.home,
      );
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : t("changePasswordError"),
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="font-display text-4xl font-semibold tracking-tight text-on-surface">
        {t("changePasswordTitle")}
      </h1>
      <p className="mt-2 text-sm text-text-secondary">{t("changePasswordSubtitle")}</p>

      <form className="mt-10 flex flex-col gap-5" onSubmit={onSubmit}>
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="current-password"
            className="text-sm font-medium text-on-surface"
          >
            {t("currentPassword")}
          </label>
          <div className="relative">
            <Lock
              className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-placeholder"
              aria-hidden
            />
            <AuthFieldInput
              id="current-password"
              name="currentPassword"
              type="password"
              autoComplete="current-password"
              required
              minLength={8}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className={fieldClass}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="new-password" className="text-sm font-medium text-on-surface">
            {t("newPassword")}
          </label>
          <div className="relative">
            <Lock
              className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-placeholder"
              aria-hidden
            />
            <AuthFieldInput
              id="new-password"
              name="newPassword"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
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
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "change-password-error" : undefined}
              className={`${fieldClass} ${error ? "border-danger" : ""}`}
            />
          </div>
          {error ? (
            <p id="change-password-error" className="text-xs text-danger" role="alert">
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
          {loading ? "…" : t("changePasswordSubmit")}
        </Button>
      </form>
    </div>
  );
}
