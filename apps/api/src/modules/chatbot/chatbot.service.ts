import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  CHATBOT_DISCLAIMERS,
  CHATBOT_REFUSAL_MESSAGES,
  loadChatbotConfig,
} from './chatbot.config';
import { ChatbotLlmService } from './services/chatbot-llm.service';
import { KnowledgeRetrievalService } from './services/knowledge-retrieval.service';
import { PiiRedactionService } from './services/pii-redaction.service';
import { ScopeGuardService } from './services/scope-guard.service';
import { ChatbotOrientationService } from './services/chatbot-orientation.service';
import { ChatbotAuditService } from './services/chatbot-audit.service';
import {
  ChatbotPersistenceService,
  type StoredChatConfidence,
} from './services/chatbot-persistence.service';
import type { ChatbotHandoffInput } from './dto/chatbot-handoff.dto';
import type { ChatbotMessageInput } from './dto/chatbot-message.dto';

export interface ChatSource {
  title: string;
  slug: string;
  url?: string;
}

export interface ChatbotMessageResult {
  reply: string;
  confidence: 'verified' | 'guidance_only' | 'refused';
  sources: ChatSource[];
  sessionId: string;
  turnCount: number;
  disclaimer?: string;
}

function toPrismaConfidence(
  confidence: 'verified' | 'guidance_only' | 'refused',
): StoredChatConfidence {
  if (confidence === 'verified') {
    return 'VERIFIED';
  }
  if (confidence === 'guidance_only') {
    return 'GUIDANCE_ONLY';
  }
  return 'REFUSED';
}

@Injectable()
export class ChatbotService {
  private readonly config = loadChatbotConfig();

  constructor(
    private readonly persistence: ChatbotPersistenceService,
    private readonly scopeGuard: ScopeGuardService,
    private readonly orientation: ChatbotOrientationService,
    private readonly piiRedaction: PiiRedactionService,
    private readonly retrieval: KnowledgeRetrievalService,
    private readonly llmService: ChatbotLlmService,
    private readonly audit: ChatbotAuditService,
  ) {}

  async handleMessage(
    input: ChatbotMessageInput & { ip?: string },
  ): Promise<ChatbotMessageResult> {
    if (!this.config.enabled) {
      throw new ServiceUnavailableException({
        code: 'chatbot_disabled',
        message: 'Chatbot is temporarily unavailable.',
      });
    }

    const redactedMessage = this.piiRedaction.redact(input.message.trim());
    if (!redactedMessage) {
      throw new BadRequestException({
        code: 'chatbot_invalid_message',
        message: 'Message cannot be empty.',
      });
    }

    const session = await this.persistence.upsertSession({
      sessionId: input.sessionId,
      locale: input.locale,
      ipHash: this.audit.hashIp(input.ip),
    });

    if (session.turnCount >= this.config.sessionTurnCap) {
      throw new ForbiddenException({
        code: 'chatbot_session_limit',
        message: 'Session turn limit reached. Please start a new conversation.',
      });
    }

    await this.persistence.createUserMessage(
      session.sessionId,
      redactedMessage,
    );

    const scope = await this.scopeGuard.evaluateWithLlm(redactedMessage);
    if (scope === 'refused') {
      const reply =
        input.locale === 'am'
          ? CHATBOT_REFUSAL_MESSAGES.am
          : CHATBOT_REFUSAL_MESSAGES.en;
      await this.persistence.createBotMessage({
        sessionId: session.sessionId,
        contentRedacted: this.piiRedaction.redact(reply),
        confidence: 'REFUSED',
        sources: [],
      });
      await this.persistence.incrementTurn(session.sessionId);
      return {
        reply,
        confidence: 'refused',
        sources: [],
        sessionId: session.sessionId,
        turnCount: session.turnCount + 1,
      };
    }

    const orientationIntent = this.orientation.matchIntent(redactedMessage);
    const orientationReply = this.orientation.buildReply(
      orientationIntent,
      input.locale,
    );
    if (orientationReply) {
      await this.persistence.createBotMessage({
        sessionId: session.sessionId,
        contentRedacted: this.piiRedaction.redact(orientationReply.reply),
        confidence: 'VERIFIED',
        sources: orientationReply.sources,
      });
      await this.persistence.incrementTurn(session.sessionId);
      return {
        reply: orientationReply.reply,
        confidence: 'verified',
        sources: orientationReply.sources,
        sessionId: session.sessionId,
        turnCount: session.turnCount + 1,
      };
    }

    const retrieval = await this.retrieval.retrieve(
      redactedMessage,
      input.locale,
    );
    const sources: ChatSource[] = retrieval.chunks.slice(0, 3).map((chunk) => ({
      title: chunk.articleTitle,
      slug: chunk.articleSlug,
      url: chunk.sourceUrl ?? undefined,
    }));

    let confidence: 'verified' | 'guidance_only';
    let disclaimer: string | undefined;
    let reply: string;

    const hasKbContext = retrieval.chunks.length > 0;

    if (hasKbContext) {
      // Published KB match — verified; no disclaimer (content is staff-reviewed).
      confidence = 'verified';
      reply = await this.llmService.generateGroundedAnswer({
        locale: input.locale,
        question: redactedMessage,
        contextBlocks: retrieval.chunks.map((c) => c.content),
      });
    } else {
      // In-scope but no KB — open orientation within government boundaries.
      confidence = 'guidance_only';
      disclaimer =
        input.locale === 'am' ? CHATBOT_DISCLAIMERS.am : CHATBOT_DISCLAIMERS.en;
      reply = await this.llmService.generateScopedGuidance({
        locale: input.locale,
        question: redactedMessage,
      });
    }

    await this.persistence.createBotMessage({
      sessionId: session.sessionId,
      contentRedacted: this.piiRedaction.redact(reply),
      confidence: toPrismaConfidence(confidence),
      sources,
    });
    await this.persistence.incrementTurn(session.sessionId);

    return {
      reply,
      confidence,
      sources,
      sessionId: session.sessionId,
      turnCount: session.turnCount + 1,
      disclaimer,
    };
  }

  handleHandoff(input: ChatbotHandoffInput): { handoffUrl: string } {
    const base = this.config.appPublicUrl.replace(/\/$/, '');
    const localePrefix = input.locale === 'am' ? '/am' : '/en';
    const handoffUrl = `${base}${localePrefix}/contact?reason=chatbot&session=${encodeURIComponent(input.sessionId)}&cause=${encodeURIComponent(input.reason)}`;
    return { handoffUrl };
  }
}
