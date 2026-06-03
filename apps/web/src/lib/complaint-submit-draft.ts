import type {
  SubmitPhase,
  WizardFormData,
  WizardStep,
} from "@/components/complaints/submit/types";
import { initialWizardFormData } from "@/components/complaints/submit/types";

const STORAGE_KEY = "mopd:complaint-submit-draft";
const TTL_MS = 60 * 60 * 1000;

export interface ComplaintSubmitDraft {
  wizardStep: WizardStep;
  form: WizardFormData;
  phase: Extract<SubmitPhase, "wizard" | "submitting">;
}

interface StoredDraft {
  savedAt: number;
  draft: ComplaintSubmitDraft;
}

function readStorage(): StoredDraft | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as StoredDraft;
    if (
      !parsed ||
      typeof parsed.savedAt !== "number" ||
      !parsed.draft?.form ||
      typeof parsed.draft.wizardStep !== "number"
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeStorage(entry: StoredDraft): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(entry));
  } catch {
    // Private mode / quota — ignore.
  }
}

function isFresh(entry: StoredDraft): boolean {
  return Date.now() - entry.savedAt < TTL_MS;
}

function normalizeForm(form: Partial<WizardFormData>): WizardFormData {
  return { ...initialWizardFormData, ...form };
}

export function getComplaintSubmitDraft(): ComplaintSubmitDraft | null {
  const stored = readStorage();
  if (!stored || !isFresh(stored)) {
    return null;
  }
  const step = stored.draft.wizardStep;
  if (step !== 1 && step !== 2 && step !== 3) {
    return null;
  }
  if (stored.draft.phase !== "wizard" && stored.draft.phase !== "submitting") {
    return null;
  }
  return {
    wizardStep: step,
    phase: stored.draft.phase,
    form: normalizeForm(stored.draft.form),
  };
}

export function setComplaintSubmitDraft(draft: ComplaintSubmitDraft): void {
  writeStorage({
    savedAt: Date.now(),
    draft: {
      wizardStep: draft.wizardStep,
      phase: draft.phase,
      form: normalizeForm(draft.form),
    },
  });
}

export function clearComplaintSubmitDraft(): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
