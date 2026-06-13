"use client";

import { useState, type FormEvent } from "react";
import { Lock } from "lucide-react";
import { useTranslations } from "next-intl";
import { ApiError } from "@/lib/api-client";
import { useSession } from "@/components/providers/auth-provider";
import { AuthFieldInput } from "@/components/forms/auth-field-input";
import { Button } from "@/components/ui/button";

const fieldClass =
  "min-h-11 w-full rounded-xl border border-staff-border bg-staff-input-bg px-4 py-2.5 text-sm text-staff-text transition-colors duration-200 placeholder:text-staff-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-staff-nav-active/30";

export function ProfileChangePasswordSection() {
  const tAuth = useTranslations("auth");
  const t = useTranslations("profile");
  const { changePassword } = useSession();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [success, setSuccess] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setSuccess(undefined);
      setError(tAuth("changePasswordMismatch"));
      return;
    }
    setLoading(true);
    setError(undefined);
    setSuccess(undefined);
    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSuccess(t("passwordSuccess"));
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : tAuth("changePasswordError"),
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section
      id="password"
      className="scroll-mt-6 rounded-xl border border-staff-border bg-staff-surface p-6"
    >
      <h2 className="font-display text-xl font-semibold text-staff-text">
        {t("passwordTitle")}
      </h2>
      <p className="mt-1 text-sm text-staff-text-muted">{t("passwordSubtitle")}</p>

      <form className="mt-6 flex max-w-lg flex-col gap-4" onSubmit={onSubmit}>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="profile-current-password" className="text-sm font-medium text-staff-text">
            {tAuth("currentPassword")}
          </label>
          <div className="relative">
            <Lock
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-staff-text-muted"
              aria-hidden
            />
            <AuthFieldInput
              id="profile-current-password"
              name="currentPassword"
              type="password"
              autoComplete="current-password"
              required
              minLength={8}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className={`${fieldClass} pl-10`}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="profile-new-password" className="text-sm font-medium text-staff-text">
            {tAuth("newPassword")}
          </label>
          <div className="relative">
            <Lock
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-staff-text-muted"
              aria-hidden
            />
            <AuthFieldInput
              id="profile-new-password"
              name="newPassword"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={`${fieldClass} pl-10`}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="profile-confirm-password" className="text-sm font-medium text-staff-text">
            {tAuth("confirmPassword")}
          </label>
          <div className="relative">
            <Lock
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-staff-text-muted"
              aria-hidden
            />
            <AuthFieldInput
              id="profile-confirm-password"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              aria-invalid={Boolean(error)}
              className={`${fieldClass} pl-10 ${error ? "border-danger" : ""}`}
            />
          </div>
          {error ? (
            <p className="text-xs text-danger" role="alert">
              {error}
            </p>
          ) : null}
          {success ? (
            <p className="text-xs text-success" role="status">
              {success}
            </p>
          ) : null}
        </div>

        <Button type="submit" variant="brand" disabled={loading} className="w-fit">
          {loading ? "…" : tAuth("changePasswordSubmit")}
        </Button>
      </form>
    </section>
  );
}
