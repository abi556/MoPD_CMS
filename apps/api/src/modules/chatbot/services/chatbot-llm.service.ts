import { Injectable } from '@nestjs/common';
import { loadChatbotConfig } from '../chatbot.config';
import { geminiEmbedText, geminiGenerateText } from './gemini-client';

export interface GroundedAnswerInput {
  locale: 'en' | 'am';
  question: string;
  contextBlocks: string[];
}

export interface ScopedGuidanceInput {
  locale: 'en' | 'am';
  question: string;
  /** Optional weak context from low-score retrieval — use cautiously. */
  contextBlocks?: string[];
}

@Injectable()
export class ChatbotLlmService {
  private readonly config = loadChatbotConfig();

  async embedText(text: string): Promise<number[]> {
    if (!this.config.geminiApiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }
    return geminiEmbedText(
      this.config.geminiApiKey,
      this.config.embedModel,
      text,
    );
  }

  async generateGroundedAnswer(input: GroundedAnswerInput): Promise<string> {
    if (!this.config.llmEnabled || !this.config.geminiApiKey) {
      return this.fallbackFromContext(input);
    }

    const context = input.contextBlocks.join('\n\n---\n\n');
    const localeInstruction =
      input.locale === 'am'
        ? 'Respond in Amharic. Use formal, clear language.'
        : 'Respond in English. Use clear, citizen-friendly language.';

    const prompt = `You are Melhiq (መልህቅ), the MoPD public orientation assistant.
${localeInstruction}
Answer ONLY using the CONTEXT below. If CONTEXT is insufficient, say you are not sure and suggest FAQ or contact.
Never invent phone numbers, emails, or policy decisions.
Do not ask for personal identifiers.

CONTEXT:
${context}

USER QUESTION:
${input.question}`;

    const text = await geminiGenerateText(
      this.config.geminiApiKey,
      this.config.answerModel,
      prompt,
    );
    return text || this.fallbackFromContext(input);
  }

  /**
   * In-scope orientation when the KB has no match — conversational but bounded.
   * Caller sets confidence to guidance_only and supplies the legal disclaimer in the API envelope only.
   */
  async generateScopedGuidance(input: ScopedGuidanceInput): Promise<string> {
    if (!this.config.llmEnabled || !this.config.geminiApiKey) {
      return this.fallbackScopedGuidance(input.locale);
    }

    const localeInstruction =
      input.locale === 'am'
        ? 'Respond in Amharic. Use formal, clear language.'
        : 'Respond in English. Use clear, citizen-friendly language.';

    const contextSection =
      input.contextBlocks && input.contextBlocks.length > 0
        ? `\nOPTIONAL BACKGROUND (may be incomplete):\n${input.contextBlocks.join('\n\n---\n\n')}\n`
        : '';

    const prompt = `You are Melhiq (መልህቅ), the public orientation assistant for Ethiopia's Ministry of Planning and Development (MoPD) complaint portal.
${localeInstruction}

Help the citizen with MoPD complaints, tracking, submission, FAQ topics, privacy, and related public services on this portal only.
Do NOT answer politics, religion, war, geopolitics, entertainment, sports, celebrities, medical/legal/financial advice, or any unrelated topic.
Never invent phone numbers, emails, deadlines, or official decisions. If unsure, suggest the FAQ page, Contact page, or submitting a complaint.
Keep answers concise (2–4 sentences). Do not mention disclaimers — the UI shows those separately.
${contextSection}
USER QUESTION:
${input.question}`;

    const text = await geminiGenerateText(
      this.config.geminiApiKey,
      this.config.answerModel,
      prompt,
    );
    return text || this.fallbackScopedGuidance(input.locale);
  }

  private fallbackScopedGuidance(locale: 'en' | 'am'): string {
    return locale === 'am'
      ? 'እባክዎ ቅሬታ ለመላክ፣ ለመከታተል ወይም ተደጋጋሚ ጥያቄዎችን ለማንበብ ከታች ያሉትን አገናኞች ይጠቀሙ።'
      : 'Please use the quick links below to submit a complaint, track a reference, or read our FAQ. For specific cases, contact us through the Contact page.';
  }

  private fallbackFromContext(input: GroundedAnswerInput): string {
    if (input.contextBlocks.length === 0) {
      return this.fallbackScopedGuidance(input.locale);
    }
    const firstBlock = input.contextBlocks[0];
    return firstBlock
      ? firstBlock.slice(0, 600)
      : this.fallbackScopedGuidance(input.locale);
  }
}
