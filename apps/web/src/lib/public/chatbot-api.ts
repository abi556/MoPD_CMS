import { apiPost } from "@/lib/api-client";

export type ChatConfidence = "verified" | "guidance_only" | "refused";

export interface ChatSource {
  title: string;
  slug: string;
  url?: string;
}

export interface ChatbotMessageResponse {
  reply: string;
  confidence: ChatConfidence;
  sources: ChatSource[];
  sessionId: string;
  turnCount: number;
  disclaimer?: string;
}

export interface ChatbotHandoffResponse {
  handoffUrl: string;
}

export async function sendChatbotMessage(input: {
  sessionId: string;
  message: string;
  locale: "en" | "am";
}): Promise<ChatbotMessageResponse> {
  return apiPost<ChatbotMessageResponse>("/chatbot/message", input, {
    auth: false,
  });
}

export async function requestChatbotHandoff(input: {
  sessionId: string;
  locale: "en" | "am";
  reason: string;
}): Promise<ChatbotHandoffResponse> {
  return apiPost<ChatbotHandoffResponse>("/chatbot/handoff", input, {
    auth: false,
  });
}
