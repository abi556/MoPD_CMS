export interface ErrorEnvelope {
  error: {
    code: string;
    message: string;
    correlationId: string;
  };
}

export interface AuthUserResponse {
  id: string;
  email: string;
  roles: string[];
  permissions: string[];
}

export interface LoginResponse {
  data: {
    accessToken: string;
    tokenType: 'Bearer';
    expiresIn: number;
    user: AuthUserResponse;
  };
}

export interface TokenResponse {
  data: {
    accessToken: string;
    tokenType: 'Bearer';
    expiresIn: number;
  };
}

export type ComplaintStatusLiteral =
  | 'SUBMITTED'
  | 'TRIAGE'
  | 'ASSIGNED'
  | 'IN_INVESTIGATION'
  | 'DRAFT_RESPONSE'
  | 'QA_LEGAL_REVIEW'
  | 'RESPONSE_ISSUED'
  | 'AWAITING_FEEDBACK'
  | 'APPEAL'
  | 'CLOSED';

export interface ComplaintCreateResponse {
  data: {
    id: string;
    referenceNo: string;
    status: ComplaintStatusLiteral;
    channel: 'WEB' | 'ASSISTED' | 'EMAIL' | 'SMS' | 'USSD';
    subject: string;
    submittedAt: string;
    locale: 'en' | 'am';
    consentGiven: boolean;
  };
}

export interface ComplaintTrackResponse {
  data: {
    referenceNo: string;
    status: ComplaintStatusLiteral;
    subject: string;
    submittedAt: string;
  };
}

export interface ComplaintListResponse {
  data: Array<{
    id: string;
    referenceNo: string;
    status: ComplaintStatusLiteral;
    channel: 'WEB' | 'ASSISTED' | 'EMAIL' | 'SMS' | 'USSD';
    subject: string;
    submittedAt: string;
    locale: 'en' | 'am';
  }>;
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface ComplaintDetailResponse {
  data: {
    id: string;
    referenceNo: string;
    status: ComplaintStatusLiteral;
    channel: 'WEB' | 'ASSISTED' | 'EMAIL' | 'SMS' | 'USSD';
    subject: string;
    description: string;
    submittedAt: string;
    locale: 'en' | 'am';
    consentGiven: boolean;
    complainantName: string | null;
    complainantEmail: string | null;
    complainantPhone: string | null;
    assignedToUserId: string | null;
    assignedByUserId: string | null;
    assignedAt: string | null;
    assignmentReason: string | null;
    lastTransitionByUserId: string | null;
    lastTransitionAt: string | null;
    lastTransitionReason: string | null;
  };
}

export interface ComplaintHistoryResponse {
  data: Array<{
    id: string;
    action: 'ASSIGNED' | 'TRANSITIONED';
    fromStatus: ComplaintStatusLiteral | null;
    toStatus: ComplaintStatusLiteral;
    actorUserId: string;
    reason: string | null;
    createdAt: string;
  }>;
}
