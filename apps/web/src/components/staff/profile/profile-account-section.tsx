"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { ApiError } from "@/lib/api-client";
import { updateOwnProfile } from "@/lib/staff/profile-api";
import { useSession } from "@/components/providers/auth-provider";
import { AuthFieldInput } from "@/components/forms/auth-field-input";
import { StaffAlert } from "@/components/staff/ui/staff-alert";
import { StaffSurfaceCard } from "@/components/staff/ui/staff-surface-card";
import { Button } from "@/components/ui/button";

const fieldClass =
  "min-h-11 w-full rounded-xl border border-staff-border bg-staff-input-bg px-4 py-2.5 text-sm text-staff-text transition-colors duration-200 placeholder:text-staff-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-staff-nav-active/30";

export function ProfileAccountSection() {
  const t = useTranslations("profile");
  const { user, refreshSession } = useSession();
  const [email, setEmail] = useState(user?.email ?? "");
  const [error, setError] = useState<string | undefined>();
  const [success, setSuccess] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  if (!user) {
    return null;
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user) return;
    const trimmed = email.trim().toLowerCase();
    if (trimmed === user.email) {
      return;
    }
    setLoading(true);
    setError(undefined);
    setSuccess(undefined);
    try {
      await updateOwnProfile({ email: trimmed });
      await refreshSession();
      setSuccess(t("accountSaveSuccess"));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("accountSaveError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <StaffSurfaceCard title={t("accountTitle")} subtitle={t("accountSubtitle")}>
      <form className="space-y-6" onSubmit={onSubmit}>
        {error ? <StaffAlert>{error}</StaffAlert> : null}
        {success ? (
          <p className="text-sm text-success" role="status">
            {success}
          </p>
        ) : null}

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="profile-email" className="text-xs font-semibold uppercase tracking-wider text-staff-text-muted">
              {t("emailLabel")}
            </label>
            <AuthFieldInput
              id="profile-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`${fieldClass} mt-2`}
            />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-staff-text-muted">
              {t("rolesLabel")}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {user.roles.length > 0 ? (
                user.roles.map((role) => (
                  <span
                    key={role}
                    className="rounded-full bg-staff-nav-active-bg/10 px-3 py-1 text-xs font-medium text-staff-nav-active"
                  >
                    {role}
                  </span>
                ))
              ) : (
                <span className="text-sm text-staff-text-muted">{t("noRoles")}</span>
              )}
            </div>
          </div>
        </div>

        <Button
          type="submit"
          variant="brand"
          disabled={loading || email.trim().toLowerCase() === user.email}
          className="w-fit min-h-11"
        >
          {loading ? "…" : t("accountSave")}
        </Button>
      </form>
    </StaffSurfaceCard>
  );
}
