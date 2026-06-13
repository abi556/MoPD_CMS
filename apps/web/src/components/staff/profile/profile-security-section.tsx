"use client";

import { useCallback, useEffect, useState } from "react";
import { Shield } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ApiError } from "@/lib/api-client";
import {
  disableMfa,
  fetchMfaStatus,
  switchMfaMethod,
  type MfaStatus,
} from "@/lib/auth/mfa-api";
import { staffRoutes } from "@/lib/staff/routes";
import { useSession } from "@/components/providers/auth-provider";
import { AdminErrorAlert } from "@/components/staff/admin/shared/admin-status-badge";
import { AuthFieldInput } from "@/components/forms/auth-field-input";
import { Button, buttonClassName } from "@/components/ui/button";

export function ProfileSecuritySection() {
  const tAuth = useTranslations("auth");
  const t = useTranslations("profile");
  const { user, refreshSession } = useSession();
  const [status, setStatus] = useState<MfaStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);
  const [disabling, setDisabling] = useState(false);
  const [showDisable, setShowDisable] = useState(false);
  const [disablePassword, setDisablePassword] = useState("");
  const [message, setMessage] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();

  const loadStatus = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      setStatus(await fetchMfaStatus());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : tAuth("mfaSettingsError"));
    } finally {
      setLoading(false);
    }
  }, [tAuth]);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  const onSwitchToEmail = async () => {
    setSwitching(true);
    setMessage(undefined);
    setError(undefined);
    try {
      const res = await switchMfaMethod("email");
      setMessage(res.message ?? tAuth("mfaMethodEmailSuccess"));
      await refreshSession();
      await loadStatus();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : tAuth("mfaSettingsError"));
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
      setMessage(res.message ?? tAuth("mfaMethodTotpSuccess"));
      await refreshSession();
      await loadStatus();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : tAuth("mfaSettingsError"));
    } finally {
      setSwitching(false);
    }
  };

  const onDisableMfa = async () => {
    setDisabling(true);
    setMessage(undefined);
    setError(undefined);
    try {
      await disableMfa(disablePassword);
      setMessage(t("mfaDisableSuccess"));
      setShowDisable(false);
      setDisablePassword("");
      await refreshSession();
      await loadStatus();
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        setError(t("mfaDisableBlocked"));
      } else {
        setError(err instanceof ApiError ? err.message : tAuth("mfaSettingsError"));
      }
    } finally {
      setDisabling(false);
    }
  };

  const enrolled = status?.enrolled ?? user?.mfaEnrolled ?? false;
  const currentMethod = status?.method ?? user?.mfaMethod ?? null;
  const elevatedRole =
    user?.roles.includes("SuperAdmin") || user?.roles.includes("SystemAdmin");

  return (
    <section
      id="security"
      className="scroll-mt-6 rounded-xl border border-staff-border bg-staff-surface p-6"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-staff-nav-active-bg/15 text-staff-nav-active">
          <Shield size={20} aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-xl font-semibold text-staff-text">
            {t("securityTitle")}
          </h2>
          <p className="mt-1 text-sm text-staff-text-muted">{t("securitySubtitle")}</p>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {error ? <AdminErrorAlert>{error}</AdminErrorAlert> : null}
        {message ? (
          <p className="text-sm text-success" role="status">
            {message}
          </p>
        ) : null}

        {loading ? (
          <p className="text-sm text-staff-text-muted">{tAuth("mfaEnrollLoading")}</p>
        ) : !enrolled ? (
          <div className="space-y-4">
            <p className="text-sm text-staff-text-muted">{t("mfaNotEnrolled")}</p>
            <Link
              href={staffRoutes.auth.mfaEnroll}
              className={buttonClassName({ variant: "brand", className: "w-fit" })}
            >
              {t("mfaEnrollCta")}
            </Link>
          </div>
        ) : (
          <dl className="space-y-4 text-sm">
            <div>
              <dt className="font-medium text-staff-text">{tAuth("mfaSettingsCurrentMethod")}</dt>
              <dd className="mt-1 text-staff-text-muted">
                {currentMethod === "email"
                  ? tAuth("mfaMethodEmail")
                  : currentMethod === "totp"
                    ? tAuth("mfaMethodTotp")
                    : tAuth("mfaMethodNone")}
              </dd>
            </div>

            {status?.totpOnly ? (
              <p className="text-staff-text-muted">{tAuth("mfaSettingsTotpOnly")}</p>
            ) : (
              <div className="flex flex-wrap gap-3">
                {currentMethod !== "totp" ? (
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={switching}
                    onClick={() => void onSwitchToTotp()}
                  >
                    {tAuth("mfaSwitchToTotp")}
                  </Button>
                ) : null}
                {currentMethod !== "email" ? (
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={switching}
                    onClick={() => void onSwitchToEmail()}
                  >
                    {tAuth("mfaSwitchToEmail")}
                  </Button>
                ) : null}
              </div>
            )}

            {!elevatedRole && !status?.totpOnly ? (
              <div className="border-t border-staff-border pt-4">
                {!showDisable ? (
                  <Button
                    type="button"
                    variant="secondary"
                    className="text-danger hover:text-danger"
                    onClick={() => setShowDisable(true)}
                  >
                    {t("mfaDisableSubmit")}
                  </Button>
                ) : (
                  <div className="max-w-md space-y-3">
                    <p className="text-sm font-medium text-staff-text">{t("mfaDisableTitle")}</p>
                    <p className="text-sm text-staff-text-muted">{t("mfaDisableHint")}</p>
                    <AuthFieldInput
                      type="password"
                      autoComplete="current-password"
                      value={disablePassword}
                      onChange={(e) => setDisablePassword(e.target.value)}
                      className="min-h-11 w-full rounded-xl border border-staff-border bg-staff-input-bg px-4 py-2.5 text-sm text-staff-text"
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        disabled={disabling || disablePassword.length < 8}
                        onClick={() => void onDisableMfa()}
                      >
                        {disabling ? "…" : t("mfaDisableSubmit")}
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                          setShowDisable(false);
                          setDisablePassword("");
                        }}
                      >
                        {t("cancel")}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </dl>
        )}
      </div>
    </section>
  );
}
