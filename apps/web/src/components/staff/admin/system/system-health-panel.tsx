"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { ApiError } from "@/lib/api-client";
import { pingAdmin } from "@/lib/staff/admin-ping-api";
import { DashboardPageHeader } from "@/components/staff/dashboard/dashboard-page-header";
import { AdminErrorAlert } from "@/components/staff/admin/shared/admin-status-badge";
import { Button } from "@/components/ui/button";

export function SystemHealthPanel() {
  const t = useTranslations("admin.system");
  const tc = useTranslations("admin.common");

  const [status, setStatus] = useState<string | null>(null);
  const [checkedAt, setCheckedAt] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      const res = await pingAdmin();
      setStatus(res.status);
      setCheckedAt(new Date());
    } catch (err) {
      setStatus(null);
      setError(err instanceof ApiError ? err.message : tc("errorGeneric"));
    } finally {
      setLoading(false);
    }
  }, [tc]);

  const isHealthy = status === "admin-ok";

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        action={
          <Button type="button" variant="brand" onClick={() => void refresh()} disabled={loading}>
            {loading ? tc("loading") : t("refresh")}
          </Button>
        }
      />

      {error ? <AdminErrorAlert>{error}</AdminErrorAlert> : null}

      <div className="rounded-xl border border-staff-border bg-staff-surface p-6">
        <div className="flex items-center gap-4">
          <span
            className={`h-4 w-4 shrink-0 rounded-full ${
              status === null
                ? "bg-staff-text-muted"
                : isHealthy
                  ? "bg-success"
                  : "bg-danger"
            }`}
            aria-hidden
          />
          <div>
            <p className="text-sm font-medium text-staff-text">{t("apiStatus")}</p>
            <p className="text-2xl font-semibold text-staff-text">
              {status ?? t("notChecked")}
            </p>
            {checkedAt ? (
              <p className="mt-1 text-sm text-staff-text-muted">
                {t("lastChecked", { time: checkedAt.toLocaleString() })}
              </p>
            ) : (
              <p className="mt-1 text-sm text-staff-text-muted">{t("hint")}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
