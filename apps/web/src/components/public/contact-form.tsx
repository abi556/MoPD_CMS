"use client";

import { useForm, ValidationError } from "@formspree/react";
import { useTranslations } from "next-intl";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ContactForm() {
  const t = useTranslations("contactForm");
  const formId = process.env.NEXT_PUBLIC_FORMSPREE_FORM_ID || "xgobkwee";
  const [state, handleSubmit] = useForm(formId);

  if (state.succeeded) {
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

      <form onSubmit={handleSubmit} className="space-y-5">
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
            placeholder={t("namePlaceholder")}
            className="mt-1.5 w-full rounded-none border border-border-standard bg-surface-bright px-4 py-3 text-body text-on-surface transition-all duration-200 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <ValidationError prefix="Name" field="name" errors={state.errors} />
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
            placeholder={t("emailPlaceholder")}
            className="mt-1.5 w-full rounded-none border border-border-standard bg-surface-bright px-4 py-3 text-body text-on-surface transition-all duration-200 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <ValidationError prefix="Email" field="email" errors={state.errors} />
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
            placeholder={t("subjectPlaceholder")}
            className="mt-1.5 w-full rounded-none border border-border-standard bg-surface-bright px-4 py-3 text-body text-on-surface transition-all duration-200 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <ValidationError prefix="Subject" field="subject" errors={state.errors} />
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
            placeholder={t("messagePlaceholder")}
            className="mt-1.5 w-full resize-none rounded-none border border-border-standard bg-surface-bright px-4 py-3 text-body text-on-surface transition-all duration-200 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <ValidationError prefix="Message" field="message" errors={state.errors} />
        </div>

        {state.errors && state.errors.length > 0 && (
          <div className="flex items-start gap-2.5 rounded-none border border-danger/20 bg-danger/5 p-4 text-danger animate-scale-in">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <div>
              <h4 className="font-label text-label font-bold">{t("errorTitle")}</h4>
              <p className="mt-1 text-body-sm text-danger/90 leading-relaxed">
                {t("errorBody")}
              </p>
            </div>
          </div>
        )}

        <Button
          type="submit"
          disabled={state.submitting}
          className="w-full rounded-none py-3 text-base font-semibold shadow-sm transition-all duration-200 hover:bg-primary/95 hover:shadow-md active:scale-[0.98] cursor-pointer"
        >
          {state.submitting ? t("submitting") : t("submit")}
        </Button>
      </form>
    </div>
  );
}
