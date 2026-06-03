"use client";

import { useCallback, useEffect, useReducer, useState } from "react";
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
import { isUploadSessionExpired } from "@/lib/upload-session";
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
  | { type: "SET_SUBMITTED"; submitted: SubmittedComplaint };

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

function initialWizardState(): State {
  const cached = getComplaintFormOptionsFromCache();
  const form = { ...initialWizardFormData };
  if (cached?.categories[0] && !form.categoryId) {
    form.categoryId = cached.categories[0].id;
  }
  return { ...initialState, form };
}

export function ComplaintSubmitWizard({ locale }: Props) {
  const t = useTranslations("complaintSubmit");
  const router = useRouter();
  const [state, dispatch] = useReducer(reducer, undefined, initialWizardState);
  const [options, setOptions] = useState<ComplaintFormOptions | null>(() =>
    getComplaintFormOptionsFromCache(),
  );
  const [optionsError, setOptionsError] = useState<string | null>(null);
  const [optionsWarning, setOptionsWarning] = useState<string | null>(null);
  const [optionsLoading, setOptionsLoading] = useState(
    () => !getComplaintFormOptionsFromCache(),
  );
  const [optionsRetrying, setOptionsRetrying] = useState(false);

  useEffect(() => {
    const categoryIdAtMount = state.form.categoryId;
    let cancelled = false;

    void (async () => {
      try {
        const data = await loadComplaintFormOptions({ force: false });
        if (cancelled) return;
        setOptions(data);
        setOptionsError(null);
        setOptionsWarning(null);
        if (!categoryIdAtMount && data.categories.length > 0) {
          dispatch({
            type: "PATCH_FORM",
            patch: { categoryId: data.categories[0].id },
          });
        }
      } catch {
        if (cancelled) return;
        const cached = getComplaintFormOptionsFromCache();
        if (cached) {
          setOptionsWarning(t("errors.optionsPartial"));
        } else {
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

  const categories = options?.categories ?? [];
  const orgUnits = options?.orgUnits ?? [];
  const optionsUnavailable =
    !optionsLoading &&
    (Boolean(optionsError) ||
      categories.length === 0 ||
      orgUnits.length === 0);
  const submitDisabled =
    optionsUnavailable || !state.form.categoryId || !state.form.orgUnitId;

  const validateStep1 = useCallback((): boolean => {
    if (!state.form.categoryId) {
      dispatch({ type: "SET_ERROR", error: t("errors.categoryRequired") });
      return false;
    }
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
    if (!state.form.region || !state.form.zone) {
      dispatch({ type: "SET_ERROR", error: t("errors.locationRequired") });
      return false;
    }
    if (!state.form.complainantName.trim()) {
      dispatch({ type: "SET_ERROR", error: t("errors.nameRequired") });
      return false;
    }
    const phone = normalizePhoneE164(state.form.complainantPhone.trim());
    if (!phone) {
      dispatch({ type: "SET_ERROR", error: t("errors.phoneRequired") });
      return false;
    }
    if (!isValidE164(phone)) {
      dispatch({ type: "SET_ERROR", error: t("errors.phoneInvalid") });
      return false;
    }
    if (!state.form.orgUnitId) {
      dispatch({ type: "SET_ERROR", error: t("errors.orgUnitRequired") });
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
    if (submitDisabled) {
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

      const created = await createPublicComplaint({
        subject: state.form.subject.trim(),
        description,
        channel: "WEB",
        consentGiven: true,
        locale,
        complainantName: state.form.complainantName.trim(),
        complainantEmail: state.form.complainantEmail.trim() || undefined,
        complainantPhone: normalizePhoneE164(state.form.complainantPhone.trim()),
        categoryId: state.form.categoryId,
        orgUnitId: state.form.orgUnitId,
        requestUploadSession: true,
      });

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
        if (!state.form.categoryId && data.categories.length > 0) {
          dispatch({
            type: "PATCH_FORM",
            patch: { categoryId: data.categories[0].id },
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
    return (
      <ComplaintSubmitSuccess
        referenceNo={state.submitted.referenceNo}
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
            onCancel={() => router.push("/")}
            error={state.error}
          />
        ) : null}

        {state.wizardStep === 2 ? (
          <ComplaintStepContactLocation
            locale={locale}
            orgUnits={orgUnits}
            orgUnitsUnavailable={optionsUnavailable}
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
            orgUnits={orgUnits}
            data={state.form}
            onBack={() => dispatch({ type: "SET_STEP", step: 2 })}
            onSubmit={submitComplaint}
            isSubmitting={state.phase === "submitting"}
            submitDisabled={submitDisabled}
            error={state.error}
          />
        ) : null}
      </div>

      {state.wizardStep === 1 ? <ComplaintInfoCards /> : null}
    </div>
  );
}
