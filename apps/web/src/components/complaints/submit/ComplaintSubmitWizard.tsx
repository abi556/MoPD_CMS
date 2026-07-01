"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useAppLocale } from "@/hooks/use-locale";
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
import {
  COMPLAINT_SUBMIT_FUNNEL,
  trackAnalyticsEvent,
  wizardStepName,
} from "@/lib/public/web-analytics";
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

type SubmitErrorState =
  | {
      kind: "validation";
      key:
        | "subjectMin"
        | "descriptionMin"
        | "consentRequired"
        | "phoneInvalid"
        | "emailInvalid";
    }
  | { kind: "api"; key: "submitFailed"; detail?: string }
  | null;

interface State {
  phase: SubmitPhase;
  wizardStep: WizardStep;
  form: WizardFormData;
  submitted: SubmittedComplaint | null;
  evidenceSessionExpired: boolean;
  error: SubmitErrorState;
}

type Action =
  | { type: "SET_PHASE"; phase: SubmitPhase }
  | { type: "OPEN_EVIDENCE"; sessionExpired: boolean }
  | { type: "SET_STEP"; step: WizardStep }
  | { type: "PATCH_FORM"; patch: Partial<WizardFormData> }
  | { type: "SET_ERROR"; error: SubmitErrorState }
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
        form: { ...action.draft.form, categoryId: "" },
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

export function ComplaintSubmitWizard() {
  const t = useTranslations("complaintSubmit");
  const locale = useAppLocale();
  const router = useRouter();
  const [state, dispatch] = useReducer(reducer, initialState);
  const [options, setOptions] = useState<ComplaintFormOptions | null>(null);
  const [optionsErrorKey, setOptionsErrorKey] = useState<
    "optionsFailed" | null
  >(null);
  const [optionsWarningKey, setOptionsWarningKey] = useState<
    "optionsPartial" | null
  >(null);
  /** Always true on server + first client paint so SSR matches hydration. */
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [optionsRetrying, setOptionsRetrying] = useState(false);
  const persistEnabledRef = useRef(false);
  const funnelStartedRef = useRef(false);

  useEffect(() => {
    if (funnelStartedRef.current) return;
    funnelStartedRef.current = true;
    trackAnalyticsEvent({
      eventType: "funnel.start",
      funnelName: COMPLAINT_SUBMIT_FUNNEL,
      locale,
    });
  }, [locale]);

  useEffect(() => {
    if (state.phase === "wizard") {
      trackAnalyticsEvent({
        eventType: "funnel.step_view",
        funnelName: COMPLAINT_SUBMIT_FUNNEL,
        funnelStep: wizardStepName(state.wizardStep),
        funnelPhase: "wizard",
        locale,
      });
      return;
    }
    if (state.phase === "submitting") {
      trackAnalyticsEvent({
        eventType: "funnel.submit_start",
        funnelName: COMPLAINT_SUBMIT_FUNNEL,
        funnelStep: "review",
        funnelPhase: "submitting",
        locale,
      });
      return;
    }
    if (state.phase === "success") {
      trackAnalyticsEvent({
        eventType: "funnel.submit_success",
        funnelName: COMPLAINT_SUBMIT_FUNNEL,
        funnelStep: "success",
        funnelPhase: "success",
        locale,
      });
      return;
    }
    if (state.phase === "evidence") {
      trackAnalyticsEvent({
        eventType: "funnel.evidence_open",
        funnelName: COMPLAINT_SUBMIT_FUNNEL,
        funnelStep: "evidence",
        funnelPhase: "evidence",
        locale,
      });
    }
  }, [state.phase, state.wizardStep, locale]);

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
    void (async () => {
      try {
        const data = await loadComplaintFormOptions({ force: false });
        if (cancelled) return;
        setOptions(data);
        setOptionsErrorKey(null);
        setOptionsWarningKey(null);
      } catch {
        if (cancelled) return;
        const fallback = getComplaintFormOptionsFromCache();
        if (fallback) {
          setOptions(fallback);
          setOptionsWarningKey("optionsPartial");
        } else {
          setOptions(null);
          setOptionsErrorKey("optionsFailed");
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
    (Boolean(optionsErrorKey) || categories.length === 0);

  const formError = state.error
    ? state.error.kind === "validation"
      ? t(`errors.${state.error.key}`)
      : (state.error.detail ?? t(`errors.${state.error.key}`))
    : null;

  const validateRequiredFields = useCallback((): boolean => {
    if (state.form.subject.trim().length < 5) {
      dispatch({
        type: "SET_ERROR",
        error: { kind: "validation", key: "subjectMin" },
      });
      return false;
    }
    if (state.form.description.trim().length < 20) {
      dispatch({
        type: "SET_ERROR",
        error: { kind: "validation", key: "descriptionMin" },
      });
      return false;
    }
    if (!state.form.consentGiven) {
      dispatch({
        type: "SET_ERROR",
        error: { kind: "validation", key: "consentRequired" },
      });
      return false;
    }
    dispatch({ type: "SET_ERROR", error: null });
    return true;
  }, [state.form]);

  const validateStep1 = useCallback((): boolean => {
    if (state.form.subject.trim().length < 5) {
      dispatch({
        type: "SET_ERROR",
        error: { kind: "validation", key: "subjectMin" },
      });
      return false;
    }
    if (state.form.description.trim().length < 20) {
      dispatch({
        type: "SET_ERROR",
        error: { kind: "validation", key: "descriptionMin" },
      });
      return false;
    }
    dispatch({ type: "SET_ERROR", error: null });
    return true;
  }, [state.form]);

  const validateStep2 = useCallback((): boolean => {
    const phoneRaw = state.form.complainantPhone.trim();
    if (phoneRaw) {
      const phone = normalizePhoneE164(phoneRaw);
      if (!phone || !isValidE164(phone)) {
        dispatch({
          type: "SET_ERROR",
          error: { kind: "validation", key: "phoneInvalid" },
        });
        return false;
      }
    }
    const emailRaw = state.form.complainantEmail.trim();
    if (emailRaw && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailRaw)) {
      dispatch({
        type: "SET_ERROR",
        error: { kind: "validation", key: "emailInvalid" },
      });
      return false;
    }
    if (!state.form.consentGiven) {
      dispatch({
        type: "SET_ERROR",
        error: { kind: "validation", key: "consentRequired" },
      });
      return false;
    }
    dispatch({ type: "SET_ERROR", error: null });
    return true;
  }, [state.form]);

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
      trackAnalyticsEvent({
        eventType: "funnel.submit_error",
        funnelName: COMPLAINT_SUBMIT_FUNNEL,
        funnelStep: "review",
        funnelPhase: "wizard",
        locale,
      });
      dispatch({
        type: "SET_ERROR",
        error: {
          kind: "api",
          key: "submitFailed",
          detail: err instanceof ApiError ? err.message : undefined,
        },
      });
    }
  };

  const handleRetryOptions = () => {
    setOptionsRetrying(true);
    setOptionsErrorKey(null);
    setOptionsLoading(true);

    void (async () => {
      try {
        const data = await loadComplaintFormOptions({ force: true });
        setOptions(data);
        setOptionsErrorKey(null);
        setOptionsWarningKey(null);
      } catch {
        const cached = getComplaintFormOptionsFromCache();
        if (cached) {
          setOptions(cached);
          setOptionsWarningKey("optionsPartial");
        } else {
          setOptionsErrorKey("optionsFailed");
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
        onFinish={() => {
          trackAnalyticsEvent({
            eventType: "funnel.evidence_complete",
            funnelName: COMPLAINT_SUBMIT_FUNNEL,
            funnelStep: "evidence",
            funnelPhase: "evidence",
            locale,
          });
          router.push("/complaints/track");
        }}
      />
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <SubmitProgressBar step={state.wizardStep} />

      {optionsErrorKey ? (
        <OptionsLoadBanner
          messageKey={optionsErrorKey}
          variant="error"
          onRetry={handleRetryOptions}
          retrying={optionsRetrying}
        />
      ) : null}

      {optionsWarningKey && !optionsErrorKey ? (
        <OptionsLoadBanner messageKey={optionsWarningKey} variant="warning" />
      ) : null}

      <div className="rounded-none border border-border-standard bg-surface p-8 shadow-sm animate-fade-in-up">
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
                trackAnalyticsEvent({
                  eventType: "funnel.step_complete",
                  funnelName: COMPLAINT_SUBMIT_FUNNEL,
                  funnelStep: "details",
                  funnelPhase: "wizard",
                  locale,
                });
                dispatch({ type: "SET_STEP", step: 2 });
              }
            }}
            onCancel={() => {
              trackAnalyticsEvent({
                eventType: "funnel.abandon",
                funnelName: COMPLAINT_SUBMIT_FUNNEL,
                funnelStep: wizardStepName(state.wizardStep),
                funnelPhase: "wizard",
                locale,
              });
              clearComplaintSubmitDraft();
              router.push("/");
            }}
            error={formError}
          />
        ) : null}

        {state.wizardStep === 2 ? (
          <ComplaintStepContactLocation
            locale={locale}
            data={state.form}
            onChange={(patch) => dispatch({ type: "PATCH_FORM", patch })}
            onNext={() => {
              if (validateStep2()) {
                trackAnalyticsEvent({
                  eventType: "funnel.step_complete",
                  funnelName: COMPLAINT_SUBMIT_FUNNEL,
                  funnelStep: "contact",
                  funnelPhase: "wizard",
                  locale,
                });
                dispatch({ type: "SET_STEP", step: 3 });
              }
            }}
            onBack={() => dispatch({ type: "SET_STEP", step: 1 })}
            error={formError}
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
            error={formError}
          />
        ) : null}
      </div>

      {state.wizardStep === 1 ? <ComplaintInfoCards /> : null}
    </div>
  );
}
