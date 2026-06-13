"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ApiError } from "@/lib/api-client";
import { fetchMfaStatus, switchMfaMethod, type MfaStatus } from "@/lib/auth/mfa-api";
import { useSession } from "@/components/providers/auth-provider";
import { DashboardPageHeader } from "@/components/staff/dashboard/dashboard-page-header";
import { AdminErrorAlert } from "@/components/staff/admin/shared/admin-status-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function ProfileMfaPanel() {
  const t = useTranslations("auth");
  const { user, refreshSession } = useSession();
  const [status, setStatus] = useState<MfaStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);
  const [message, setMessage] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();

  const loadStatus = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      setStatus(await fetchMfaStatus());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("mfaSettingsError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  const onSwitchToEmail = async () => {
    setSwitching(true);
    setMessage(undefined);
    setError(undefined);
    try {
      const res = await switchMfaMethod("email");
      setMessage(res.message ?? t("mfaMethodEmailSuccess"));
      await refreshSession();
      await loadStatus();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("mfaSettingsError"));
    } finally {
      setSwitching(false);
    }
  };

  const onSwitchToTotp = async () => {
    setSwitching(true);
    setMessage(undefined);
    setError(undefined);
    try {
      const res = await switchMfaMethod("totp");
      setMessage(res.message ?? t("mfaMethodTotpSuccess"));
      await refreshSession();
      await loadStatus();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("mfaSettingsError"));
    } finally {
      setSwitching(false);
    }
  };

  const currentMethod = status?.method ?? user?.mfaMethod ?? null;

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title={t("mfaSettingsTitle")}
        subtitle={t("mfaSettingsSubtitle")}
      />

      {error ? <AdminErrorAlert>{error}</AdminErrorAlert> : null}
      {message ? (
        <p className="text-sm text-success" role="status">
          {message}
        </p>
      ) : null}

      <Card className="p-6">
        {loading ? (
          <p className="text-sm text-text-secondary">{t("mfaEnrollLoading")}</p>
        ) : (
          <dl className="space-y-4 text-sm">
            <div>
              <dt className="font-medium text-on-surface">{t("mfaSettingsCurrentMethod")}</dt>
              <dd className="mt-1 text-text-secondary">
                {currentMethod === "email"
                  ? t("mfaMethodEmail")
                  : currentMethod === "totp"
                    ? t("mfaMethodTotp")
                    : t("mfaMethodNone")}
              </dd>
            </div>
            {status?.totpOnly ? (
              <p className="text-text-secondary">{t("mfaSettingsTotpOnly")}</p>
            ) : (
              <div className="flex flex-wrap gap-3">
                {currentMethod !== "totp" ? (
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={switching || !status?.enrolled}
                    onClick={() => void onSwitchToTotp()}
                  >
                    {t("mfaSwitchToTotp")}
                  </Button>
                ) : null}
                {currentMethod !== "email" ? (
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={switching || !status?.enrolled}
                    onClick={() => void onSwitchToEmail()}
                  >
                    {t("mfaSwitchToEmail")}
                  </Button>
                ) : null}
              </div>
            )}
          </dl>
        )}
      </Card>
    </div>
  );
}
