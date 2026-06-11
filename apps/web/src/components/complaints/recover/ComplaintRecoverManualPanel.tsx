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
  "min-h-11 w-full rounded-none border border-border-standard bg-surface-container-lowest px-3 py-2 text-body text-on-surface shadow-sm transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2";

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
      <div className="mx-auto w-full max-w-lg px-gutter py-12 pb-20 text-center md:py-16 md:pb-28 animate-fade-in-up">
        <CheckCircle2 className="mx-auto mb-4 h-14 w-14 text-success animate-scale-in" aria-hidden />
        <h1 className="mb-2 text-display font-semibold text-on-surface tracking-tight">
          {t("successTitle")}
        </h1>
        <p className="mb-8 text-body text-text-secondary leading-relaxed">{successMessage || t("successBody")}</p>
        <Link href="/complaints/track">
          <Button variant="secondary">{t("backToRecover")}</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full px-gutter py-12 pb-20 md:py-16 md:pb-28 animate-fade-in-up">
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
          <h1 className="text-display font-semibold leading-tight text-on-surface tracking-tight">
            {t("title")}
          </h1>
          <p className="mt-4 text-body text-text-secondary leading-relaxed">{t("intro")}</p>
        </div>
      </header>

      <div className="mx-auto w-full max-w-lg">
        <form className="space-y-6" onSubmit={onSubmit}>
          <Input
            label={t("fields.subjectFragment")}
            name="subjectFragment"
            value={subjectFragment}
            onChange={(e) => setSubjectFragment(e.target.value)}
            placeholder={t("fields.subjectFragmentPlaceholder")}
            hint={t("fields.subjectFragmentHint")}
            required
            className="rounded-none"
          />

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <Input
              label={t("fields.submittedDateGregorian")}
              name="submittedDateGregorian"
              type="date"
              value={submittedDateGregorian}
              onChange={(e) => setSubmittedDateGregorian(e.target.value)}
              className="rounded-none"
            />
            <Input
              label={t("fields.submittedDateEthiopian")}
              name="submittedDateEthiopian"
              value={submittedDateEthiopian}
              onChange={(e) => setSubmittedDateEthiopian(e.target.value)}
              placeholder={t("fields.submittedDateEthiopianPlaceholder")}
              hint={t("fields.submittedDateEthiopianHint")}
              className="rounded-none"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="categoryId" className="text-label font-semibold text-on-surface">
              {t("fields.category")}{" "}
              <span className="font-normal text-text-secondary">{t("optional")}</span>
            </label>
            <select
              id="categoryId"
              name="categoryId"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className={selectClassName}
            >
              <option value="">{t("fields.categoryPlaceholder")}</option>
              {options?.categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {optionLabel(cat, locale)}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label htmlFor="orgUnitId" className="text-label font-semibold text-on-surface">
              {t("fields.orgUnit")}{" "}
              <span className="font-normal text-text-secondary">{t("optional")}</span>
            </label>
            <select
              id="orgUnitId"
              name="orgUnitId"
              value={orgUnitId}
              onChange={(e) => setOrgUnitId(e.target.value)}
              className={selectClassName}
            >
              <option value="">{t("fields.orgUnitPlaceholder")}</option>
              {options?.orgUnits.map((ou) => (
                <option key={ou.id} value={ou.id}>
                  {optionLabel(ou, locale)}
                </option>
              ))}
            </select>
          </div>

          <Input
            label={t("fields.contactEmail")}
            name="contactEmail"
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            placeholder={t("fields.contactEmailPlaceholder")}
            hint={t("fields.contactEmailHint")}
            required
            className="rounded-none"
          />

          <div className="space-y-1">
            <label htmlFor="additionalNotes" className="text-label font-semibold text-on-surface">
              {t("fields.additionalNotes")}{" "}
              <span className="font-normal text-text-secondary">{t("optional")}</span>
            </label>
            <textarea
              id="additionalNotes"
              name="additionalNotes"
              rows={4}
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              placeholder={t("fields.additionalNotesPlaceholder")}
              className="w-full resize-none rounded-none border border-border-standard p-3 text-body focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {error ? (
            <p className="text-sm text-danger animate-fade-in-up" role="alert">
              {error}
            </p>
          ) : null}

          <Button type="submit" size="lg" fullWidth disabled={loading}>
            {loading ? t("submitting") : t("submit")}
          </Button>
        </form>
      </div>
    </div>
  );
}
