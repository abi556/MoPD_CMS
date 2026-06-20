"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { AppLocale } from "@/i18n/routing";
import { ApiError } from "@/lib/api-client";
import { updateOwnProfile } from "@/lib/staff/profile-api";
import { useClientIntlSwitch } from "@/components/providers/client-intl-provider";
import { useSession } from "@/components/providers/auth-provider";
import { StaffAlert } from "@/components/staff/ui/staff-alert";
import { StaffSurfaceCard } from "@/components/staff/ui/staff-surface-card";
import { Button } from "@/components/ui/button";

export function ProfilePreferencesSection() {
  const t = useTranslations("profile");
  const { user, refreshSession } = useSession();
  const switchLocale = useClientIntlSwitch();
  const [locale, setLocale] = useState<AppLocale>(
    (user?.preferredLocale as AppLocale | undefined) ?? "en",
  );
  const [error, setError] = useState<string | undefined>();
  const [success, setSuccess] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  if (!user) {
    return null;
  }

  async function onSave() {
    setLoading(true);
    setError(undefined);
    setSuccess(undefined);
    try {
      await updateOwnProfile({ preferredLocale: locale });
      await refreshSession();
      await switchLocale(locale);
      setSuccess(t("preferencesSaveSuccess"));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("preferencesSaveError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <StaffSurfaceCard title={t("preferencesTitle")} subtitle={t("preferencesSubtitle")}>
      <div className="space-y-6">
        {error ? <StaffAlert>{error}</StaffAlert> : null}
        {success ? (
          <p className="text-sm text-success" role="status">
            {success}
          </p>
        ) : null}

        <fieldset>
          <legend className="text-sm font-medium text-staff-text">{t("localeLabel")}</legend>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:gap-6">
            {(["en", "am"] as const).map((value) => (
              <label
                key={value}
                className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-staff-border px-4 py-3 has-[:checked]:border-staff-nav-active has-[:checked]:bg-staff-nav-active-bg/10"
              >
                <input
                  type="radio"
                  name="preferredLocale"
                  value={value}
                  checked={locale === value}
                  onChange={() => setLocale(value)}
                  className="h-4 w-4 accent-staff-nav-active"
                />
                <span className="text-sm font-medium text-staff-text">
                  {value === "en" ? t("localeEn") : t("localeAm")}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <Button
          type="button"
          variant="brand"
          disabled={loading || locale === (user.preferredLocale ?? "en")}
          onClick={() => void onSave()}
          className="w-fit min-h-11"
        >
          {loading ? "…" : t("preferencesSave")}
        </Button>
      </div>
    </StaffSurfaceCard>
  );
}
