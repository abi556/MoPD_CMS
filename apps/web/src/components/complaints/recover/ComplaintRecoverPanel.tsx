"use client";

import { useCallback, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowLeft, ArrowRight, Mail, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "@/i18n/navigation";
import { isValidE164, normalizePhoneE164 } from "@/lib/normalize-phone";
import {
  requestRecoveryOtp,
  verifyRecoveryOtp,
  type RecoveredReference,
  type RecoveryChannel,
} from "@/lib/public-complaint-recovery";
import { ApiError } from "@/lib/api-client";

type Step = "contact" | "otp" | "results";

export function ComplaintRecoverPanel() {
  const t = useTranslations("complaintRecover");
  const locale = useLocale() as "en" | "am";
  const [step, setStep] = useState<Step>("contact");
  const [channel, setChannel] = useState<RecoveryChannel>("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [references, setReferences] = useState<RecoveredReference[]>([]);

  const buildPayload = useCallback(() => {
    if (channel === "email") {
      return {
        channel: "email" as const,
        email: email.trim(),
        locale,
      };
    }
    const normalized = normalizePhoneE164(phone.trim());
    return {
      channel: "sms" as const,
      phone: normalized ?? phone.trim(),
      locale,
    };
  }, [channel, email, phone, locale]);

  const onRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (channel === "email") {
      if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        setError(t("errors.emailInvalid"));
        return;
      }
    } else {
      const normalized = normalizePhoneE164(phone.trim());
      if (!normalized || !isValidE164(normalized)) {
        setError(t("errors.phoneInvalid"));
        return;
      }
    }

    setLoading(true);
    try {
      await requestRecoveryOtp(buildPayload());
      setStep("otp");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("errors.requestFailed"));
    } finally {
      setLoading(false);
    }
  };

  const onVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!/^\d{6}$/.test(code.trim())) {
      setError(t("errors.codeInvalid"));
      return;
    }

    setLoading(true);
    try {
      const result = await verifyRecoveryOtp({
        ...buildPayload(),
        code: code.trim(),
      });
      setReferences(result.references);
      setStep("results");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("errors.verifyFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full px-gutter py-12 pb-20 md:py-16 md:pb-28">
      <header className="relative mx-auto mb-8 w-full max-w-lg md:mb-10 md:max-w-max-width">
        <Link
          href="/complaints/track"
          aria-label={t("backToTrack")}
          className="mb-4 inline-flex items-center gap-1.5 text-body-sm font-medium text-primary hover:underline md:absolute md:left-0 md:top-0 md:z-10 md:mb-0 md:pt-1.5"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
          {t("back")}
        </Link>
        <div className="w-full text-left md:mx-auto md:max-w-lg">
          <h1 className="text-display font-semibold leading-tight text-on-surface">
            {t("title")}
          </h1>
          <p className="mt-4 text-body text-text-secondary">{t("intro")}</p>
        </div>
      </header>

      <div className="mx-auto w-full max-w-lg">
      {step === "contact" ? (
        <form className="space-y-6" onSubmit={onRequestOtp}>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={channel === "email" ? "primary" : "secondary"}
              className="flex-1 gap-2"
              onClick={() => setChannel("email")}
            >
              <Mail className="h-4 w-4" aria-hidden />
              {t("channelEmail")}
            </Button>
            <Button
              type="button"
              variant={channel === "sms" ? "primary" : "secondary"}
              className="flex-1 gap-2"
              onClick={() => setChannel("sms")}
            >
              <Smartphone className="h-4 w-4" aria-hidden />
              {t("channelSms")}
            </Button>
          </div>
          {channel === "email" ? (
            <Input
              label={t("emailLabel")}
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("emailPlaceholder")}
              hint={t("emailHint")}
            />
          ) : (
            <Input
              label={t("phoneLabel")}
              name="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t("phonePlaceholder")}
              hint={t("phoneSmsHint")}
            />
          )}
          <p className="border-t border-border-standard pt-4 text-body-sm text-text-secondary">
            {t("manualFallback")}{" "}
            <Link
              href="/complaints/recover/manual"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              {t("manualLink")}
            </Link>
          </p>
          <p className="text-body-sm text-text-secondary">{t("requestNote")}</p>
          {error ? (
            <p className="text-sm text-danger" role="alert">
              {error}
            </p>
          ) : null}
          <Button type="submit" className="w-full gap-2" disabled={loading}>
            {loading ? t("sending") : t("sendCode")}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Button>
        </form>
      ) : null}

      {step === "otp" ? (
        <form className="space-y-6" onSubmit={onVerifyOtp}>
          <p className="text-body text-text-secondary">{t("otpIntro")}</p>
          <Input
            label={t("codeLabel")}
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="000000"
          />
          {error ? (
            <p className="text-sm text-danger" role="alert">
              {error}
            </p>
          ) : null}
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={() => {
                setStep("contact");
                setCode("");
                setError(null);
              }}
            >
              {t("changeContact")}
            </Button>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t("verifying") : t("verifyCode")}
            </Button>
          </div>
        </form>
      ) : null}

      {step === "results" ? (
        <div className="space-y-6">
          {references.length === 0 ? (
            <p className="rounded-lg border border-border-standard bg-surface-container p-4 text-body text-on-surface-variant">
              {t("noReferences")}
            </p>
          ) : (
            <ul className="space-y-4">
              {references.map((ref) => (
                <li
                  key={ref.referenceNo}
                  className="rounded-lg border border-border-standard bg-surface-container p-4"
                >
                  <p className="font-mono text-h3 text-brand-deep">
                    {ref.referenceNo}
                  </p>
                  <p className="mt-1 text-body-sm text-text-secondary">
                    {t("submittedAt", {
                      date: new Date(ref.submittedAt).toLocaleDateString(
                        locale === "am" ? "am-ET" : "en-GB",
                      ),
                    })}
                  </p>
                  <Link
                    href={`/complaints/track?ref=${encodeURIComponent(ref.referenceNo)}`}
                    className="mt-3 inline-block"
                  >
                    <Button type="button" variant="secondary" className="w-full sm:w-auto">
                      {t("trackThis")}
                    </Button>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            onClick={() => {
              setStep("contact");
              setCode("");
              setReferences([]);
              setError(null);
            }}
          >
            {t("searchAgain")}
          </Button>
        </div>
      ) : null}
      </div>
    </div>
  );
}
