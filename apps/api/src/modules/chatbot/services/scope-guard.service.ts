import { Injectable } from '@nestjs/common';
import { loadChatbotConfig } from '../chatbot.config';
import { geminiGenerateText } from './gemini-client';

export type ScopeDecision = 'in_scope' | 'refused' | 'uncertain';

const OFF_TOPIC_PATTERNS: RegExp[] = [
  // Politics & elections
  /\b(election|electoral|vote|voting|ballot|campaign|politic|political party|parliament|legislature|propaganda|opposition party)\b/i,
  /\b(president|prime minister|premier|cabinet minister|regime|coup|impeach)\b/i,
  // Religion
  /\b(religion|religious|church|mosque|temple|synagogue|bible|quran|koran|atheist|prayer|worship|denomination)\b/i,
  /\b(christian|muslim|islam|orthodox|evangelical|protestant|catholic|hijab|halal|haram)\b/i,
  // War, conflict & geopolitics
  /\b(war|warfare|armed conflict|invasion|military offensive|geopolitic|geopolitical|nato|sanction)\b/i,
  /\b(soldier|army|navy|air force|battlefield|ceasefire|insurgent|militia)\b/i,
  /\b(ukraine|russia|gaza|palestine|israel|iran|syria|yemen|sudan)\b/i,
  // Entertainment, sports & celebrities
  /\b(entertainment|celebrity|movie|film|actor|actress|netflix|tiktok|influencer)\b/i,
  /\b(music|song|album|concert|rapper|singer|football|soccer|basketball|premier league|champions league|world cup)\b/i,
  /\b(video game|gaming|playstation|xbox|nintendo)\b/i,
  // International relations (not MoPD portal scope)
  /\b(foreign policy|diplomat|embassy|superpower|cold war|un security council)\b/i,
  // Finance / medical / abuse (existing)
  /\b(bitcoin|crypto|stock|forex|gambling|lottery)\b/i,
  /\b(diagnos|prescri|medical|surgery|covid vaccine)\b/i,
  /\b(hack|exploit|bypass security|sql injection)\b/i,
  // Amharic off-topic hints
  /(ፖለቲካ|ቀዳማዊ|ክርስት|ሙስሊም|ጦርነት|ጦር|ሃይማኖት|ፊልም|ሙዚቃ|እግር ኳስ)/u,
];

/** Greetings and chatbot identity — always in scope; skip LLM classifier. */
const META_IN_SCOPE_PATTERNS: RegExp[] = [
  /^who are you\b/i,
  /^what are you\b/i,
  /^who is melhiq\b/i,
  /^what is melhiq\b/i,
  /^what can you (do|help)/i,
  /^(hi|hello|hey)\b/i,
  /\b(tell me about|what is|about)\b.*\b(mopd|ministry)\b/i,
  /\b(office hours?|working hours?|when.*open)\b/i,
  /^(ማን ነህ|ማን ነሽ|ስራ\s*ሰዓት)/u,
];

const IN_SCOPE_PATTERNS: RegExp[] = [
  // MoPD & portal identity
  /\b(mopd|melhiq|ministry of planning|planning and development|ministry)\b/i,
  /\b(this portal|complaint portal|citizen portal|government portal)\b/i,
  // Complaint lifecycle
  /\b(complaint|grievance|report an issue|lodge|file a|submit|submission)\b/i,
  /\b(track|tracking|reference number|ref(?:erence)?\s*#?|case (?:id|number|status))\b/i,
  /\b(status|pending|assigned|resolved|closed|escalat|follow[- ]?up|update on my)\b/i,
  /\b(appeal|reopen|dispute|sla|deadline|timeline|response time)\b/i,
  // Account & access
  /\b(login|log in|sign in|account|password|recover|reset|register|sign up)\b/i,
  // Help content & contact
  /\b(faq|frequently asked|help|support|contact|office hours?|working hours?|when.*open)\b/i,
  /\b(handoff|human agent|speak to (?:staff|someone)|talk to (?:staff|someone))\b/i,
  // Privacy & documents
  /\b(privacy|personal data|data protection|confidential|anonymous)\b/i,
  /\b(attachment|document|evidence|upload|category|org unit)\b/i,
  // Ethiopian public service (portal-related, not politics)
  /\b(public service|citizen service|ethiopia(?:n)?\s+(?:citizen|resident))\b/i,
  // Amharic — portal & complaint vocabulary (no \b — Ethiopic word boundaries are unreliable)
  /(ቅሬታ|መከታተል|ማጣቀሻ|ሚኒስትር|ዕቅድ|ልማት|መልህቅ|ግላዊነት|አገልግሎት|ድረ-ገጽ|መድረክ|ማስገባት|ሁኔታ|ጥያቄ)/u,
];

@Injectable()
export class ScopeGuardService {
  private readonly config = loadChatbotConfig();

  evaluate(message: string): ScopeDecision {
    const normalized = message.trim();
    if (!normalized) {
      return 'refused';
    }

    if (OFF_TOPIC_PATTERNS.some((pattern) => pattern.test(normalized))) {
      return 'refused';
    }

    if (
      META_IN_SCOPE_PATTERNS.some((pattern) => pattern.test(normalized)) ||
      IN_SCOPE_PATTERNS.some((pattern) => pattern.test(normalized))
    ) {
      return 'in_scope';
    }

    return 'uncertain';
  }

  shouldSkipLlmClassifier(message: string): boolean {
    const normalized = message.trim();
    return META_IN_SCOPE_PATTERNS.some((pattern) => pattern.test(normalized));
  }

  async evaluateWithLlm(message: string): Promise<ScopeDecision> {
    const ruleDecision = this.evaluate(message);
    if (ruleDecision === 'refused') {
      return 'refused';
    }

    if (ruleDecision === 'in_scope' && this.shouldSkipLlmClassifier(message)) {
      return 'in_scope';
    }

    if (!this.config.llmEnabled || !this.config.geminiApiKey) {
      // Without a classifier, only allow clearly in-scope rule matches.
      return ruleDecision === 'in_scope' ? 'in_scope' : 'refused';
    }

    try {
      const prompt = `You are a scope classifier for Ethiopia Ministry of Planning and Development (MoPD) public complaint portal chatbot "Melhiq".
Reply with exactly one word: IN_SCOPE or REFUSED.

IN_SCOPE (answer allowed):
- MoPD complaints, submission, tracking, reference numbers, appeals, SLA, privacy
- This portal's FAQ, office hours, contact, account recovery
- Greetings and questions about who Melhiq is or what MoPD does
- General Ethiopian public-service orientation closely tied to using this portal

REFUSED (must not answer — reply I can't help with that):
- Politics, elections, parties, leaders, government criticism or praise
- Religion, faith, religious figures or practices
- War, armed conflict, military operations, geopolitics, international disputes
- Entertainment, sports, celebrities, movies, music, games
- Medical, legal, or financial advice; hacking; unrelated personal chat
- Any topic not connected to MoPD or this complaint portal

User message: ${message}`;
      const text = (
        await geminiGenerateText(
          this.config.geminiApiKey,
          this.config.scopeModel,
          prompt,
        )
      ).toUpperCase();
      if (text.includes('REFUSED')) {
        return 'refused';
      }
      if (text.includes('IN_SCOPE')) {
        return 'in_scope';
      }
      return ruleDecision === 'in_scope' ? 'in_scope' : 'refused';
    } catch {
      return ruleDecision === 'in_scope' ? 'in_scope' : 'refused';
    }
  }
}
