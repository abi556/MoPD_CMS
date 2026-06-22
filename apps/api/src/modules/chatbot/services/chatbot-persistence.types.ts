import { ComplaintLocale } from '@prisma/client';

export type StoredChatConfidence = 'VERIFIED' | 'GUIDANCE_ONLY' | 'REFUSED';

export interface ChatSourcePayload {
  title: string;
  slug: string;
  url?: string;
}

export interface ActiveChatSession {
  sessionId: string;
  turnCount: number;
  locale: ComplaintLocale;
}
