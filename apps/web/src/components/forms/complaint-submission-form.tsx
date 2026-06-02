"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  createPublicComplaint,
  uploadComplaintEvidence,
} from "@/lib/public-complaints";
import { ApiError } from "@/lib/api-client";
import { Link } from "@/i18n/navigation";

type Step = 1 | 2 | 3;

interface Props {
  locale: "en" | "am";
}

export function ComplaintSubmissionForm({ locale }: Props) {
  const t = useTranslations("complaintSubmit");
  const [step, setStep] = useState<Step>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{
    referenceNo: string;
    warning?: string;
  } | null>(null);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [consentGiven, setConsentGiven] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

  const selectedCount = useMemo(() => files.length, [files]);

  function validateStep1(): boolean {
    if (subject.trim().length < 5) {
      setError(t("errors.subjectMin"));
      return false;
    }
    if (description.trim().length < 20) {
      setError(t("errors.descriptionMin"));
      return false;
    }
    setError(null);
    return true;
  }

  function validateStep2(): boolean {
    if (!consentGiven) {
      setError(t("errors.consentRequired"));
      return false;
    }
    setError(null);
    return true;
  }

  function onFileChange(fileList: FileList | null) {
    setFiles(fileList ? Array.from(fileList) : []);
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!validateStep1() || !validateStep2()) {
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const created = await createPublicComplaint({
        subject: subject.trim(),
        description: description.trim(),
        channel: "WEB",
        consentGiven: true,
        locale,
        complainantName: name.trim() || undefined,
        complainantEmail: email.trim() || undefined,
        complainantPhone: phone.trim() || undefined,
        requestUploadSession: true,
      });

      let warning: string | undefined;
      if (files.length > 0 && created.uploadSession?.token) {
        const failures: string[] = [];
        for (const file of files) {
          try {
            await uploadComplaintEvidence(
              created.id,
              created.uploadSession.token,
              file,
            );
          } catch {
            failures.push(file.name);
          }
        }
        if (failures.length > 0) {
          warning = t("warnings.partialUpload", {
            count: failures.length,
          });
        }
      }

      setSuccess({ referenceNo: created.referenceNo, warning });
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError(t("errors.submitFailed"));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (success) {
    return (
      <Card className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-semibold text-on-surface">{t("success.title")}</h1>
        <p className="mt-3 text-text-secondary">{t("success.body")}</p>
        <p className="mt-4 rounded-md bg-brand-surface px-4 py-3 font-semibold text-primary">
          {t("success.reference")}: {success.referenceNo}
        </p>
        {success.warning ? (
          <p className="mt-3 rounded-md border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
            {success.warning}
          </p>
        ) : null}
        <div className="mt-5">
          <Link href="/complaints/track" className="text-primary underline underline-offset-4">
            {t("success.trackLink")}
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-3xl space-y-6">
      <Card>
        <div className="flex flex-wrap gap-2 text-sm">
          <span className={step === 1 ? "font-semibold text-primary" : "text-text-secondary"}>
            {t("steps.one")}
          </span>
          <span className={step === 2 ? "font-semibold text-primary" : "text-text-secondary"}>
            {t("steps.two")}
          </span>
          <span className={step === 3 ? "font-semibold text-primary" : "text-text-secondary"}>
            {t("steps.threeOptional")}
          </span>
        </div>
      </Card>

      {step === 1 ? (
        <Card className="space-y-4">
          <h2 className="text-xl font-semibold text-on-surface">{t("sectionDetails")}</h2>
          <Input
            label={t("fields.subject")}
            name="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
          />
          <div className="flex flex-col gap-1">
            <label htmlFor="description" className="text-sm font-medium text-on-surface">
              {t("fields.description")}
            </label>
            <textarea
              id="description"
              name="description"
              rows={6}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-md border border-border-standard bg-surface-container-lowest px-3 py-2 text-sm text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
              required
            />
          </div>
          <div className="flex justify-end">
            <Button
              type="button"
              onClick={() => {
                if (validateStep1()) setStep(2);
              }}
            >
              {t("actions.next")}
            </Button>
          </div>
        </Card>
      ) : null}

      {step === 2 ? (
        <Card className="space-y-4">
          <h2 className="text-xl font-semibold text-on-surface">{t("sectionContact")}</h2>
          <Input
            label={t("fields.name")}
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            label={t("fields.email")}
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            label={t("fields.phone")}
            name="phone"
            placeholder="+2519..."
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <label className="flex items-start gap-3 text-sm text-on-surface">
            <input
              type="checkbox"
              checked={consentGiven}
              onChange={(e) => setConsentGiven(e.target.checked)}
              className="mt-1"
            />
            <span>{t("fields.consent")}</span>
          </label>
          <div className="flex justify-between">
            <Button type="button" variant="secondary" onClick={() => setStep(1)}>
              {t("actions.back")}
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (validateStep2()) setStep(3);
              }}
            >
              {t("actions.next")}
            </Button>
          </div>
        </Card>
      ) : null}

      {step === 3 ? (
        <Card className="space-y-4">
          <h2 className="text-xl font-semibold text-on-surface">{t("sectionEvidence")}</h2>
          <p className="text-sm text-text-secondary">{t("fields.evidenceHint")}</p>
          <input
            type="file"
            multiple
            onChange={(e) => onFileChange(e.target.files)}
            className="block w-full text-sm text-on-surface file:mr-3 file:rounded-md file:border file:border-border-standard file:bg-surface-container-low file:px-3 file:py-2"
          />
          <p className="text-sm text-text-secondary">
            {t("fields.selectedFiles", { count: selectedCount })}
          </p>
          <div className="flex justify-between">
            <Button type="button" variant="secondary" onClick={() => setStep(2)}>
              {t("actions.back")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t("actions.submitting") : t("actions.submit")}
            </Button>
          </div>
        </Card>
      ) : null}

      {error ? (
        <p className="rounded-md border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </p>
      ) : null}
    </form>
  );
}
