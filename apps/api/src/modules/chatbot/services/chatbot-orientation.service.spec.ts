import { ChatbotOrientationService } from './chatbot-orientation.service';
import { ComplaintLocale } from '@prisma/client';

describe('ChatbotOrientationService', () => {
  const service = new ChatbotOrientationService();

  it('matches identity questions', () => {
    expect(service.matchIntent('who are you')).toBe('identity');
    const reply = service.buildReply('identity', ComplaintLocale.en);
    expect(reply?.reply).toContain('Melhiq');
  });

  it('matches office hours questions', () => {
    expect(service.matchIntent('when is the MoPD office open')).toBe(
      'office_hours',
    );
  });

  it('matches about MoPD questions', () => {
    expect(service.matchIntent('tell me about MoPD')).toBe('about_mopd');
  });
});
