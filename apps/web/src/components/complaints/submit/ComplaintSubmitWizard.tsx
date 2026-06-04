"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { buildDescriptionWithLocation } from "@/lib/build-complaint-description";
import { isValidE164, normalizePhoneE164 } from "@/lib/normalize-phone";
import {
  createPublicComplaint,
  getComplaintFormOptionsFromCache,
  loadComplaintFormOptions,
  type ComplaintFormOptions,
} from "@/lib/public-complaints";
import { ApiError } from "@/lib/api-client";
import {
  clearComplaintSubmitDraft,
  getComplaintSubmitDraft,
  setComplaintSubmitDraft,
} from "@/lib/complaint-submit-draft";
import { isUploadSessionExpired } from "@/lib/upload-session";
import {
  deriveAckContext,
  maskEmailForDisplay,
} from "@/lib/complaint-ack-context";
import { sortCategoriesForPicker } from "./category-picker-order";
import { ComplaintInfoCards } from "./ComplaintInfoCards";
import { ComplaintEvidencePanel } from "./ComplaintEvidencePanel";
import { ComplaintStepContactLocation } from "./ComplaintStepContactLocation";
import { ComplaintStepDetails } from "./ComplaintStepDetails";
import { ComplaintStepReview } from "./ComplaintStepReview";
import { ComplaintSubmitSuccess } from "./ComplaintSubmitSuccess";
import { OptionsLoadBanner } from "./OptionsLoadBanner";
import { SubmitProgressBar } from "./SubmitProgressBar";
import {
  initialWizardFormData,
  type SubmitPhase,
  type SubmittedComplaint,
  type WizardFormData,
  type WizardStep,
} from "./types";

interface Props {
  locale: "en" | "am";
}

interface State {
  phase: SubmitPhase;
  wizardStep: WizardStep;
  form: WizardFormData;
  submitted: SubmittedComplaint | null;
  evidenceSessionExpired: boolean;
  error: string | null;
}

type Action =
  | { type: "SET_PHASE"; phase: SubmitPhase }
  | { type: "OPEN_EVIDENCE"; sessionExpired: boolean }
  | { type: "SET_STEP"; step: WizardStep }
  | { type: "PATCH_FORM"; patch: Partial<WizardFormData> }
  | { type: "SET_ERROR"; error: string | null }
  | { type: "SET_SUBMITTED"; submitted: SubmittedComplaint }
  | { type: "RESTORE_DRAFT"; draft: Pick<State, "wizardStep" | "form" | "phase"> };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_PHASE":
      return { ...state, phase: action.phase };
    case "OPEN_EVIDENCE":
      return {
        ...state,
        phase: "evidence",
        evidenceSessionExpired: action.sessionExpired,
      };
    case "SET_STEP":
      return { ...state, wizardStep: action.step, error: null };
    case "PATCH_FORM":
      return { ...state, form: { ...state.form, ...action.patch }, error: null };
    case "SET_ERROR":
      return { ...state, error: action.error };
    case "SET_SUBMITTED":
      return {
        ...state,
        submitted: action.submitted,
        phase: "success",
        error: null,
      };
    case "RESTORE_DRAFT":
      return {
        ...state,
        wizardStep: action.draft.wizardStep,
        form: action.draft.form,
        phase: action.draft.phase === "submitting" ? "wizard" : action.draft.phase,
        error: null,
      };
    default:
      return state;
  }
}

const initialState: State = {
  phase: "wizard",
  wizardStep: 1,
  form: initialWizardFormData,
  submitted: null,
  evidenceSessionExpired: false,
  error: null,
};

function defaultCategoryId(
  categories: ComplaintFormOptions["categories"],
): string | undefined {
  const sorted = sortCategoriesForPicker(categories);
  return sorted[0]?.id;
}

export function ComplaintSubmitWizard({ locale }: Props) {
  const t = useTranslations("complaintSubmit");
  const router = useRouter();
  const [state, dispatch] = useReducer(reducer, initialState);
  const [options, setOptions] = useState<ComplaintFormOptions | null>(null);
  const [optionsError, setOptionsError] = useState<string | null>(null);
  const [optionsWarning, setOptionsWarning] = useState<string | null>(null);
  /** Always true on server + first client paint so SSR matches hydration. */
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [optionsRetrying, setOptionsRetrying] = useState(false);
  const persistEnabledRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    const draft = getComplaintSubmitDraft();
    if (draft) {
      dispatch({ type: "RESTORE_DRAFT", draft });
      requestAnimationFrame(() => {
        persistEnabledRef.current = true;
      });
    } else {
      persistEnabledRef.current = true;
    }
    const categoryIdAtMount = draft?.form.categoryId ?? "";

    void (async () => {
      try {
        const data = await loadComplaintFormOptions({ force: false });
        if (cancelled) return;
        setOptions(data);
        setOptionsError(null);
        setOptionsWarning(null);
        const defaultId = defaultCategoryId(data.categories);
        if (!categoryIdAtMount && defaultId) {
          dispatch({
            type: "PATCH_FORM",
            patch: { categoryId: defaultId },
          });
        }
      } catch {
        if (cancelled) return;
        const fallback = getComplaintFormOptionsFromCache();
        if (fallback) {
          setOptions(fallback);
          setOptionsWarning(t("errors.optionsPartial"));
          const defaultId = defaultCategoryId(fallback.categories);
          if (!categoryIdAtMount && defaultId) {
            dispatch({
              type: "PATCH_FORM",
              patch: { categoryId: defaultId },
            });
          }
        } else {
          setOptions(null);
          setOptionsError(t("errors.optionsFailed"));
        }
      } finally {
        if (!cancelled) {
          setOptionsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount revalidate only
  }, []);

  useEffect(() => {
    if (!persistEnabledRef.current) {
      return;
    }
    if (state.phase !== "wizard" && state.phase !== "submitting") {
      return;
    }
    setComplaintSubmitDraft({
      wizardStep: state.wizardStep,
      form: state.form,
      phase: state.phase === "submitting" ? "submitting" : "wizard",
    });
  }, [state.phase, state.wizardStep, state.form]);

  const categories = options?.categories ?? [];
  const optionsUnavailable =
    !optionsLoading &&
    (Boolean(optionsError) || categories.length === 0);

  const validateRequiredFields = useCallback((): boolean => {
    if (state.form.subject.trim().length < 5) {
      dispatch({ type: "SET_ERROR", error: t("errors.subjectMin") });
      return false;
    }
    if (state.form.description.trim().length < 20) {
      dispatch({ type: "SET_ERROR", error: t("errors.descriptionMin") });
      return false;
    }
    if (!state.form.consentGiven) {
      dispatch({ type: "SET_ERROR", error: t("errors.consentRequired") });
      return false;
    }
    dispatch({ type: "SET_ERROR", error: null });
    return true;
  }, [state.form, t]);

  const validateStep1 = useCallback((): boolean => {
    if (state.form.subject.trim().length < 5) {
      dispatch({ type: "SET_ERROR", error: t("errors.subjectMin") });
      return false;
    }
    if (state.form.description.trim().length < 20) {
      dispatch({ type: "SET_ERROR", error: t("errors.descriptionMin") });
      return false;
    }
    dispatch({ type: "SET_ERROR", error: null });
    return true;
  }, [state.form, t]);

  const validateStep2 = useCallback((): boolean => {
    const phoneRaw = state.form.complainantPhone.trim();
    if (phoneRaw) {
      const phone = normalizePhoneE164(phoneRaw);
      if (!phone || !isValidE164(phone)) {
        dispatch({ type: "SET_ERROR", error: t("errors.phoneInvalid") });
        return false;
      }
    }
    const emailRaw = state.form.complainantEmail.trim();
    if (emailRaw && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailRaw)) {
      dispatch({ type: "SET_ERROR", error: t("errors.emailInvalid") });
      return false;
    }
    if (!state.form.consentGiven) {
      dispatch({ type: "SET_ERROR", error: t("errors.consentRequired") });
      return false;
    }
    dispatch({ type: "SET_ERROR", error: null });
    return true;
  }, [state.form, t]);

  const submitComplaint = async () => {
    if (!validateRequiredFields()) {
      return;
    }

    dispatch({ type: "SET_PHASE", phase: "submitting" });
    dispatch({ type: "SET_ERROR", error: null });

    try {
      const description = buildDescriptionWithLocation(
        state.form.description,
        {
          region: state.form.region,
          zone: state.form.zone,
          woreda: state.form.woreda,
        },
        locale,
      );

      const phoneNormalized = normalizePhoneE164(
        state.form.complainantPhone.trim(),
      );

      const created = await createPublicComplaint({
        subject: state.form.subject.trim(),
        description,
        channel: "WEB",
        consentGiven: true,
        locale,
        complainantName: state.form.complainantName.trim() || undefined,
        complainantEmail: state.form.complainantEmail.trim() || undefined,
        complainantPhone: phoneNormalized || undefined,
        categoryId: state.form.categoryId || undefined,
        requestUploadSession: true,
      });

      clearComplaintSubmitDraft();
      dispatch({
        type: "SET_SUBMITTED",
        submitted: {
          complaintId: created.id,
          referenceNo: created.referenceNo,
          uploadSession: created.uploadSession,
        },
      });
    } catch (err) {
      dispatch({ type: "SET_PHASE", phase: "wizard" });
      dispatch({
        type: "SET_ERROR",
        error:
          err instanceof ApiError ? err.message : t("errors.submitFailed"),
      });
    }
  };

  const handleRetryOptions = () => {
    setOptionsRetrying(true);
    setOptionsError(null);
    setOptionsLoading(true);

    void (async () => {
      try {
        const data = await loadComplaintFormOptions({ force: true });
        setOptions(data);
        setOptionsError(null);
        setOptionsWarning(null);
        const defaultId = defaultCategoryId(data.categories);
        if (!state.form.categoryId && defaultId) {
          dispatch({
            type: "PATCH_FORM",
            patch: { categoryId: defaultId },
          });
        }
      } catch {
        const cached = getComplaintFormOptionsFromCache();
        if (cached) {
          setOptions(cached);
          setOptionsWarning(t("errors.optionsPartial"));
        } else {
          setOptionsError(t("errors.optionsFailed"));
        }
      } finally {
        setOptionsLoading(false);
        setOptionsRetrying(false);
      }
    })();
  };

  if (state.phase === "success" && state.submitted) {
    const ackContext = deriveAckContext(state.form);
    const maskedEmail =
      ackContext === "email"
        ? maskEmailForDisplay(state.form.complainantEmail)
        : undefined;

    return (
      <ComplaintSubmitSuccess
        referenceNo={state.submitted.referenceNo}
        ackContext={ackContext}
        maskedEmail={maskedEmail}
        onAttachEvidence={() =>
          dispatch({
            type: "OPEN_EVIDENCE",
            sessionExpired: isUploadSessionExpired(
              state.submitted?.uploadSession ?? null,
            ),
          })
        }
        onDone={() => router.push("/")}
      />
    );
  }

  if (state.phase === "evidence" && state.submitted) {
    return (
      <ComplaintEvidencePanel
        complaintId={state.submitted.complaintId}
        referenceNo={state.submitted.referenceNo}
        uploadSession={state.submitted.uploadSession}
        sessionExpired={state.evidenceSessionExpired}
        onBack={() => dispatch({ type: "SET_PHASE", phase: "success" })}
        onFinish={() => router.push("/complaints/track")}
      />
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <SubmitProgressBar step={state.wizardStep} />

      {optionsError ? (
        <OptionsLoadBanner
          message={optionsError}
          variant="error"
          onRetry={handleRetryOptions}
          retrying={optionsRetrying}
        />
      ) : null}

      {optionsWarning && !optionsError ? (
        <OptionsLoadBanner message={optionsWarning} variant="warning" />
      ) : null}

      <div className="rounded-xl border border-border-standard bg-surface p-8 shadow-sm">
        {state.wizardStep === 1 ? (
          <ComplaintStepDetails
            locale={locale}
            categories={categories}
            categoriesLoading={optionsLoading && categories.length === 0}
            categoriesUnavailable={optionsUnavailable}
            data={state.form}
            onChange={(patch) => dispatch({ type: "PATCH_FORM", patch })}
            onNext={() => {
              if (validateStep1()) {
                dispatch({ type: "SET_STEP", step: 2 });
              }
            }}
            onCancel={() => {
              clearComplaintSubmitDraft();
              router.push("/");
            }}
            error={state.error}
          />
        ) : null}

        {state.wizardStep === 2 ? (
          <ComplaintStepContactLocation
            locale={locale}
            data={state.form}
            onChange={(patch) => dispatch({ type: "PATCH_FORM", patch })}
            onNext={() => {
              if (validateStep2()) {
                dispatch({ type: "SET_STEP", step: 3 });
              }
            }}
            onBack={() => dispatch({ type: "SET_STEP", step: 1 })}
            error={state.error}
          />
        ) : null}

        {state.wizardStep === 3 ? (
          <ComplaintStepReview
            locale={locale}
            categories={categories}
            data={state.form}
            onBack={() => dispatch({ type: "SET_STEP", step: 2 })}
            onSubmit={submitComplaint}
            isSubmitting={state.phase === "submitting"}
            error={state.error}
          />
        ) : null}
      </div>

      {state.wizardStep === 1 ? <ComplaintInfoCards /> : null}
    </div>
  );
}
