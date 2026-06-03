import type { ComplaintUploadSession } from "@/lib/public-complaints";

export type WizardStep = 1 | 2 | 3;

export type SubmitPhase = "wizard" | "submitting" | "success" | "evidence";

export interface WizardFormData {
  categoryId: string;
  subject: string;
  description: string;
  region: string;
  zone: string;
  woreda: string;
  orgUnitId: string;
  complainantName: string;
  complainantEmail: string;
  complainantPhone: string;
  consentGiven: boolean;
}

export interface SubmittedComplaint {
  complaintId: string;
  referenceNo: string;
  uploadSession: ComplaintUploadSession | null;
}

export const initialWizardFormData: WizardFormData = {
  categoryId: "",
  subject: "",
  description: "",
  region: "",
  zone: "",
  woreda: "",
  orgUnitId: "",
  complainantName: "",
  complainantEmail: "",
  complainantPhone: "",
  consentGiven: false,
};
