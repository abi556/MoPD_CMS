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

type RecoverErrorState =
  | {
      kind: "validation";
      key: "emailInvalid" | "phoneInvalid" | "codeInvalid";
    }
  | { kind: "api"; key: "requestFailed" | "verifyFailed"; detail?: string }
  | null;

export function ComplaintRecoverPanel() {
  const t = useTranslations("complaintRecover");
  const locale = useLocale() as "en" | "am";
  const [step, setStep] = useState<Step>("contact");
  const [channel, setChannel] = useState<RecoveryChannel>("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorState, setErrorState] = useState<RecoverErrorState>(null);
  const [references, setReferences] = useState<RecoveredReference[]>([]);

  const error = errorState
    ? errorState.kind === "validation"
      ? t(`errors.${errorState.key}`)
      : (errorState.detail ?? t(`errors.${errorState.key}`))
    : null;

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
    setErrorState(null);

    if (channel === "email") {
      if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        setErrorState({ kind: "validation", key: "emailInvalid" });
        return;
      }
    } else {
      const normalized = normalizePhoneE164(phone.trim());
      if (!normalized || !isValidE164(normalized)) {
        setErrorState({ kind: "validation", key: "phoneInvalid" });
        return;
      }
    }

    setLoading(true);
    try {
      await requestRecoveryOtp(buildPayload());
      setStep("otp");
    } catch (err) {
      setErrorState({
        kind: "api",
        key: "requestFailed",
        detail: err instanceof ApiError ? err.message : undefined,
      });
    } finally {
      setLoading(false);
    }
  };

  const onVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorState(null);
    if (!/^\d{6}$/.test(code.trim())) {
      setErrorState({ kind: "validation", key: "codeInvalid" });
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
      setErrorState({
        kind: "api",
        key: "verifyFailed",
        detail: err instanceof ApiError ? err.message : undefined,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full px-gutter py-12 pb-20 md:py-16 md:pb-28 animate-fade-in-up">
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
          <h1 className="text-display font-semibold leading-tight text-on-surface tracking-tight">
            {t("title")}
          </h1>
          <p className="mt-4 text-body text-text-secondary leading-relaxed">{t("intro")}</p>
        </div>
      </header>

      <div className="mx-auto w-full max-w-lg">
      {step === "contact" ? (
        <form className="space-y-6 animate-fade-in-up" onSubmit={onRequestOtp}>
          <div className="flex gap-3">
            <Button
              type="button"
              variant={channel === "email" ? "primary" : "secondary"}
              className="flex-1"
              size="lg"
              onClick={() => setChannel("email")}
            >
              <Mail className="h-4 w-4" aria-hidden />
              {t("channelEmail")}
            </Button>
            <Button
              type="button"
              variant={channel === "sms" ? "primary" : "secondary"}
              className="flex-1"
              size="lg"
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
              className="rounded-none"
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
              className="rounded-none"
            />
          )}
          <p className="border-t border-border-standard pt-4 text-body-sm text-text-secondary leading-relaxed">
            {t("manualFallback")}{" "}
            <Link
              href="/complaints/recover/manual"
              className="font-semibold text-primary underline-offset-4 hover:underline"
            >
              {t("manualLink")}
            </Link>
          </p>
          <p className="text-body-sm text-text-secondary leading-relaxed">{t("requestNote")}</p>
          {error ? (
            <p className="text-sm text-danger animate-fade-in-up" role="alert">
              {error}
            </p>
          ) : null}
          <Button type="submit" size="lg" fullWidth disabled={loading}>
            {loading ? t("sending") : t("sendCode")}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Button>
        </form>
      ) : null}

      {step === "otp" ? (
        <form className="space-y-6 animate-fade-in-up" onSubmit={onVerifyOtp}>
          <p className="text-body text-text-secondary leading-relaxed">{t("otpIntro")}</p>
          <Input
            label={t("codeLabel")}
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="000000"
            className="rounded-none font-mono tracking-widest text-center text-lg"
          />
          {error ? (
            <p className="text-sm text-danger animate-fade-in-up" role="alert">
              {error}
            </p>
          ) : null}
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              type="button"
              variant="secondary"
              fullWidth
              onClick={() => {
                setStep("contact");
                setCode("");
                setErrorState(null);
              }}
            >
              {t("changeContact")}
            </Button>
            <Button type="submit" fullWidth disabled={loading}>
              {loading ? t("verifying") : t("verifyCode")}
            </Button>
          </div>
        </form>
      ) : null}

      {step === "results" ? (
        <div className="space-y-6 animate-fade-in-up">
          {references.length === 0 ? (
            <p className="rounded-none border border-border-standard bg-surface-container p-4 text-body text-on-surface-variant animate-fade-in-up">
              {t("noReferences")}
            </p>
          ) : (
            <ul className="space-y-4">
              {references.map((ref, index) => (
                <li
                  key={ref.referenceNo}
                  style={{ animationDelay: `${index * 50}ms` }}
                  className="rounded-none border border-border-standard bg-surface-container p-5 transition-all duration-200 hover:shadow-sm animate-fade-in-up fill-mode-both"
                >
                  <p className="font-mono text-h3 font-bold text-brand-deep">
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
                    className="mt-4 inline-block"
                  >
                    <Button variant="primary">
                      {t("trackLink")}
                      <ArrowRight className="h-4 w-4" aria-hidden />
                    </Button>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
      </div>
    </div>
  );
}
