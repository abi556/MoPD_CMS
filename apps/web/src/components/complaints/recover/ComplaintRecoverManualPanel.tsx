"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "@/i18n/navigation";
import { createRecoveryInquiry } from "@/lib/public-complaint-recovery";
import {
  loadComplaintFormOptions,
  optionLabel,
  type ComplaintFormOptions,
} from "@/lib/public-complaints";
import { ApiError } from "@/lib/api-client";

const selectClassName =
  "min-h-11 w-full rounded-md border border-border-standard bg-surface-container-lowest px-3 py-2 text-body text-on-surface shadow-sm transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2";

export function ComplaintRecoverManualPanel() {
  const t = useTranslations("complaintRecoverManual");
  const locale = useLocale() as "en" | "am";
  const [options, setOptions] = useState<ComplaintFormOptions | null>(null);
  const [subjectFragment, setSubjectFragment] = useState("");
  const [submittedDateGregorian, setSubmittedDateGregorian] = useState("");
  const [submittedDateEthiopian, setSubmittedDateEthiopian] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [orgUnitId, setOrgUnitId] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorState, setErrorState] = useState<
    | {
        kind: "validation";
        key: "subjectMin" | "emailInvalid";
      }
    | { kind: "api"; key: "rateLimited" | "submitFailed"; detail?: string }
    | null
  >(null);
  const [done, setDone] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const error = errorState
    ? errorState.kind === "validation"
      ? t(`errors.${errorState.key}`)
      : (errorState.detail ?? t(`errors.${errorState.key}`))
    : null;

  useEffect(() => {
    void loadComplaintFormOptions().then(setOptions).catch(() => setOptions(null));
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorState(null);
    if (subjectFragment.trim().length < 5) {
      setErrorState({ kind: "validation", key: "subjectMin" });
      return;
    }
    const email = contactEmail.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorState({ kind: "validation", key: "emailInvalid" });
      return;
    }

    setLoading(true);
    try {
      const result = await createRecoveryInquiry({
        subjectFragment: subjectFragment.trim(),
        contactEmail: email,
        submittedDateGregorian: submittedDateGregorian || undefined,
        submittedDateEthiopian: submittedDateEthiopian.trim() || undefined,
        categoryId: categoryId || undefined,
        orgUnitId: orgUnitId || undefined,
        additionalNotes: additionalNotes.trim() || undefined,
        locale,
      });
      setSuccessMessage(result.message);
      setDone(true);
    } catch (err) {
      if (err instanceof ApiError && err.code === "RATE_LIMIT_EXCEEDED") {
        setErrorState({ kind: "api", key: "rateLimited" });
      } else {
        setErrorState({
          kind: "api",
          key: "submitFailed",
          detail: err instanceof ApiError ? err.message : undefined,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="mx-auto w-full max-w-lg px-gutter py-12 pb-20 text-center md:py-16 md:pb-28">
        <CheckCircle2 className="mx-auto mb-4 h-14 w-14 text-success" aria-hidden />
        <h1 className="mb-2 text-display font-semibold text-on-surface">
          {t("successTitle")}
        </h1>
        <p className="mb-8 text-body text-text-secondary">{successMessage || t("successBody")}</p>
        <Link href="/complaints/track">
          <Button variant="secondary">{t("backToRecover")}</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full px-gutter py-12 pb-20 md:py-16 md:pb-28">
      <header className="relative mx-auto mb-8 w-full max-w-lg md:mb-10 md:max-w-max-width">
        <Link
          href="/complaints/recover"
          aria-label={t("backToRecover")}
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

      <form className="mx-auto w-full max-w-lg space-y-6" onSubmit={onSubmit}>
        <Input
          label={t("contactEmailLabel")}
          name="contactEmail"
          type="email"
          autoComplete="email"
          value={contactEmail}
          onChange={(e) => setContactEmail(e.target.value)}
          placeholder={t("contactEmailPlaceholder")}
          hint={t("contactEmailHint")}
          required
        />
        <Input
          label={t("subjectLabel")}
          name="subject"
          value={subjectFragment}
          onChange={(e) => setSubjectFragment(e.target.value)}
          placeholder={t("subjectPlaceholder")}
          required
        />
        <Input
          label={t("dateGregorianLabel")}
          name="dateGregorian"
          type="date"
          value={submittedDateGregorian}
          onChange={(e) => setSubmittedDateGregorian(e.target.value)}
        />
        <Input
          label={t("dateEthiopianLabel")}
          name="dateEthiopian"
          value={submittedDateEthiopian}
          onChange={(e) => setSubmittedDateEthiopian(e.target.value)}
          placeholder={t("dateEthiopianPlaceholder")}
        />
        {options ? (
          <>
            <div className="space-y-1">
              <label htmlFor="categoryId" className="text-sm font-medium text-on-surface">
                {t("categoryLabel")}
              </label>
              <select
                id="categoryId"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                suppressHydrationWarning
                className={selectClassName}
              >
                <option value="">—</option>
                {options.categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {optionLabel(c, locale)}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label htmlFor="orgUnitId" className="text-sm font-medium text-on-surface">
                {t("orgUnitLabel")}
              </label>
              <select
                id="orgUnitId"
                value={orgUnitId}
                onChange={(e) => setOrgUnitId(e.target.value)}
                suppressHydrationWarning
                className={selectClassName}
              >
                <option value="">—</option>
                {options.orgUnits.map((o) => (
                  <option key={o.id} value={o.id}>
                    {optionLabel(o, locale)}
                  </option>
                ))}
              </select>
            </div>
          </>
        ) : null}
        <div className="space-y-1">
          <label htmlFor="notes" className="text-sm font-medium text-on-surface">
            {t("notesLabel")}
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            value={additionalNotes}
            onChange={(e) => setAdditionalNotes(e.target.value)}
            suppressHydrationWarning
            className={selectClassName}
          />
        </div>
        {error ? (
          <p className="text-sm text-danger" role="alert">
            {error}
          </p>
        ) : null}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? t("submitting") : t("submit")}
        </Button>
      </form>
    </div>
  );
}
