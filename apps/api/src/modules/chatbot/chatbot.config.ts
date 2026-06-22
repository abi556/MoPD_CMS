export interface ChatbotConfig {
  enabled: boolean;
  llmEnabled: boolean;
  sessionTurnCap: number;
  retrievalMinScore: number;
  geminiApiKey: string;
  scopeModel: string;
  answerModel: string;
  embedModel: string;
  appPublicUrl: string;
}

export function loadChatbotConfig(): ChatbotConfig {
  return {
    enabled: process.env.CHATBOT_ENABLED !== 'false',
    llmEnabled: process.env.CHATBOT_LLM_ENABLED !== 'false',
    sessionTurnCap: parseInt(process.env.CHATBOT_SESSION_TURN_CAP ?? '20', 10),
    retrievalMinScore: parseFloat(
      process.env.CHATBOT_RETRIEVAL_MIN_SCORE ?? '0.75',
    ),
    geminiApiKey: process.env.GEMINI_API_KEY ?? '',
    scopeModel: process.env.GEMINI_SCOPE_MODEL ?? 'gemini-2.0-flash',
    answerModel: process.env.GEMINI_ANSWER_MODEL ?? 'gemini-2.0-flash',
    embedModel: process.env.GEMINI_EMBED_MODEL ?? 'text-embedding-004',
    appPublicUrl: process.env.APP_PUBLIC_URL ?? 'http://localhost:3000',
  };
}

export const CHATBOT_DISCLAIMERS = {
  en: 'This response is general guidance only and does not constitute an official MoPD decision. For case-specific matters, submit or track a complaint on this portal.',
  am: 'ይህ መልስ አጠቃላይ መመሪያ ብቻ ነው እና ኦፊሴላዊ ውሳኔ አይደለም። ለተወሰነ ጉዳይ ቅሬታ ያስገቡ ወይም ይከታተሉ።',
} as const;

export const CHATBOT_REFUSAL_MESSAGES = {
  en: "I can't answer questions about that. I only help with MoPD complaints, tracking, FAQ topics, and related public services on this portal. Try the quick links below or visit our FAQ.",
  am: 'ስለዚያ ጥያቄ መልስ መስጠት አልችልም። ስለ ሚኒስትሪው ቅሬታ፣ መከታተል፣ ተደጋጋሚ ጥያቄዎች እና በዚህ መድረክ ላይ ተዛማጅ የህዝብ አገልግሎቶች ብቻ ልረዳዎ እችላለሁ። ከታች ያሉትን አገናኞች ይሞክሩ ወይም ወደ ጥያቄዎች ገጽ ይሂዱ።',
} as const;
