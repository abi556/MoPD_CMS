"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useAppLocale } from "@/hooks/use-locale";
import { ApiError } from "@/lib/api-client";
import { isValidE164, normalizePhoneE164 } from "@/lib/normalize-phone";
import {
  loadComplaintFormOptions,
  optionLabel,
  type ComplaintFormOptions,
} from "@/lib/public-complaints";
import { createAssistedComplaint } from "@/lib/staff/complaints-api";
import { staffRoutes } from "@/lib/staff/routes";
import { DashboardPageHeader } from "@/components/staff/dashboard/dashboard-page-header";
import { StaffAlert } from "@/components/staff/ui/staff-alert";
import { StaffSurfaceCard } from "@/components/staff/ui/staff-surface-card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const fieldClass =
  "min-h-11 w-full rounded-xl border border-staff-border bg-staff-input-bg px-4 py-2.5 text-sm text-staff-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-staff-nav-active/30";

export function StaffComplaintIntakeWizard() {
  const t = useTranslations("complaints.intake");
  const locale = useAppLocale();
  const router = useRouter();

  const [options, setOptions] = useState<ComplaintFormOptions | null>(null);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [complainantName, setComplainantName] = useState("");
  const [complainantEmail, setComplainantEmail] = useState("");
  const [complainantPhone, setComplainantPhone] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [consentGiven, setConsentGiven] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void loadComplaintFormOptions().then(setOptions);
  }, []);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (subject.trim().length < 5) {
      setError(t("validationSubject"));
      return;
    }
    if (description.trim().length < 20) {
      setError(t("validationDescription"));
      return;
    }
    if (!consentGiven) {
      setError(t("validationConsent"));
      return;
    }

    const phoneNormalized = normalizePhoneE164(complainantPhone.trim());
    if (complainantPhone.trim() && (!phoneNormalized || !isValidE164(phoneNormalized))) {
      setError(t("submitFailed"));
      return;
    }

    setLoading(true);
    setError(undefined);
    try {
      const created = await createAssistedComplaint({
        subject: subject.trim(),
        description: description.trim(),
        locale,
        consentGiven: true,
        complainantName: complainantName.trim() || undefined,
        complainantEmail: complainantEmail.trim() || undefined,
        complainantPhone: phoneNormalized || undefined,
        categoryId: categoryId || undefined,
      });
      router.push(staffRoutes.complaintDetail(created.id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("submitFailed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader title={t("title")} subtitle={t("subtitle")} />

      <StaffSurfaceCard>
        <form className="space-y-5" onSubmit={onSubmit}>
          {error ? <StaffAlert>{error}</StaffAlert> : null}

          <div>
            <label htmlFor="intake-subject" className="text-sm font-medium text-staff-text">
              {t("subject")}
            </label>
            <input
              id="intake-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              minLength={5}
              className={`${fieldClass} mt-1.5`}
            />
          </div>

          <Textarea
            label={t("description")}
            name="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            required
            minLength={20}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="intake-name" className="text-sm font-medium text-staff-text">
                {t("complainantName")}
              </label>
              <input
                id="intake-name"
                value={complainantName}
                onChange={(e) => setComplainantName(e.target.value)}
                className={`${fieldClass} mt-1.5`}
              />
            </div>
            <div>
              <label htmlFor="intake-email" className="text-sm font-medium text-staff-text">
                {t("complainantEmail")}
              </label>
              <input
                id="intake-email"
                type="email"
                value={complainantEmail}
                onChange={(e) => setComplainantEmail(e.target.value)}
                className={`${fieldClass} mt-1.5`}
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="intake-phone" className="text-sm font-medium text-staff-text">
                {t("complainantPhone")}
              </label>
              <input
                id="intake-phone"
                type="tel"
                value={complainantPhone}
                onChange={(e) => setComplainantPhone(e.target.value)}
                className={`${fieldClass} mt-1.5`}
              />
            </div>
          </div>

          {options ? (
            <div>
              <label htmlFor="intake-category" className="text-sm font-medium text-staff-text">
                {t("category")}
              </label>
              <select
                id="intake-category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className={`${fieldClass} mt-1.5`}
              >
                <option value="">{t("selectCategory")}</option>
                {options.categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {optionLabel(cat, locale)}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <label className="flex min-h-11 cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={consentGiven}
              onChange={(e) => setConsentGiven(e.target.checked)}
              className="mt-1 h-4 w-4 accent-staff-nav-active"
            />
            <span className="text-sm text-staff-text">{t("consent")}</span>
          </label>

          <Button type="submit" variant="brand" disabled={loading} className="min-h-11 w-fit">
            {loading ? t("submitting") : t("submit")}
          </Button>
        </form>
      </StaffSurfaceCard>
    </div>
  );
}
