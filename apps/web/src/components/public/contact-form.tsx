"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiPost, ApiError } from "@/lib/api-client";
import { trackAnalyticsEvent } from "@/lib/public/web-analytics";
import { useLocale } from "next-intl";

export function ContactForm() {
  const t = useTranslations("contactForm");
  const locale = useLocale() as "en" | "am";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [succeeded, setSucceeded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await apiPost<{ message: string }>(
        "/contact",
        {
          name: name.trim() || undefined,
          email: email.trim(),
          subject: subject.trim(),
          message: message.trim(),
        },
        { auth: false },
      );
      trackAnalyticsEvent({
        eventType: "contact.submit_success",
        funnelName: "contact",
        locale,
      });
      setSucceeded(true);
    } catch (err) {
      const messageText =
        err instanceof ApiError
          ? err.message
          : t("errorBody");
      setError(messageText);
    } finally {
      setSubmitting(false);
    }
  };

  if (succeeded) {
    return (
      <div className="rounded-none border border-success/20 bg-success/5 p-6 text-center animate-scale-in">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-success/10 text-success">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <h3 className="font-h3 text-h3 font-bold text-success">
          {t("successTitle")}
        </h3>
        <p className="mt-2 text-body-sm text-text-secondary leading-relaxed">
          {t("successBody")}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-none border border-border-standard bg-surface-container-lowest p-6 md:p-8 shadow-sm">
      <div className="mb-6">
        <h3 className="font-h2 text-h2 font-semibold text-on-background">
          {t("title")}
        </h3>
        <p className="mt-1.5 text-body-sm text-text-secondary">
          {t("subtitle")}
        </p>
      </div>

      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5" suppressHydrationWarning>
        <div>
          <label
            htmlFor="name"
            className="block font-label text-label font-semibold text-on-surface"
          >
            {t("nameLabel")}
          </label>
          <input
            id="name"
            type="text"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("namePlaceholder")}
            suppressHydrationWarning
            className="mt-1.5 w-full rounded-none border border-border-standard bg-surface-bright px-4 py-3 text-body text-on-surface transition-all duration-200 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div>
          <label
            htmlFor="email"
            className="block font-label text-label font-semibold text-on-surface"
          >
            {t("emailLabel")} <span className="text-danger">*</span>
          </label>
          <input
            id="email"
            type="email"
            name="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("emailPlaceholder")}
            suppressHydrationWarning
            className="mt-1.5 w-full rounded-none border border-border-standard bg-surface-bright px-4 py-3 text-body text-on-surface transition-all duration-200 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div>
          <label
            htmlFor="subject"
            className="block font-label text-label font-semibold text-on-surface"
          >
            {t("subjectLabel")} <span className="text-danger">*</span>
          </label>
          <input
            id="subject"
            type="text"
            name="subject"
            required
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder={t("subjectPlaceholder")}
            suppressHydrationWarning
            className="mt-1.5 w-full rounded-none border border-border-standard bg-surface-bright px-4 py-3 text-body text-on-surface transition-all duration-200 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div>
          <label
            htmlFor="message"
            className="block font-label text-label font-semibold text-on-surface"
          >
            {t("messageLabel")} <span className="text-danger">*</span>
          </label>
          <textarea
            id="message"
            name="message"
            required
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t("messagePlaceholder")}
            suppressHydrationWarning
            className="mt-1.5 w-full resize-none rounded-none border border-border-standard bg-surface-bright px-4 py-3 text-body text-on-surface transition-all duration-200 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {error ? (
          <div className="flex items-start gap-2.5 rounded-none border border-danger/20 bg-danger/5 p-4 text-danger animate-scale-in">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <div>
              <h4 className="font-label text-label font-bold">{t("errorTitle")}</h4>
              <p className="mt-1 text-body-sm text-danger/90 leading-relaxed">
                {error}
              </p>
            </div>
          </div>
        ) : null}

        <Button type="submit" size="lg" fullWidth disabled={submitting}>
          {submitting ? t("submitting") : t("submit")}
        </Button>
      </form>
    </div>
  );
}
