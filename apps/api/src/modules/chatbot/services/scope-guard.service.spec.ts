import { ScopeGuardService } from './scope-guard.service';

describe('ScopeGuardService', () => {
  const service = new ScopeGuardService();

  it('refuses clearly off-topic political questions without LLM', () => {
    expect(service.evaluate('Who will win the next election?')).toBe('refused');
  });

  it('allows complaint-related questions', () => {
    expect(service.evaluate('How do I track my complaint?')).toBe('in_scope');
  });

  it('allows Amharic in-scope keywords', () => {
    expect(service.evaluate('ቅሬታ እንዴት እሰጥ?')).toBe('in_scope');
  });

  it('allows who are you without LLM', () => {
    expect(service.evaluate('who are you')).toBe('in_scope');
    expect(service.shouldSkipLlmClassifier('who are you')).toBe(true);
  });

  it('refuses empty input', () => {
    expect(service.evaluate('   ')).toBe('refused');
  });

  it('refuses politics, religion, entertainment, war, and geopolitics', () => {
    expect(service.evaluate('Who will win the next election?')).toBe('refused');
    expect(service.evaluate('What is the best religion?')).toBe('refused');
    expect(service.evaluate('Who won the football match yesterday?')).toBe(
      'refused',
    );
    expect(service.evaluate('Tell me about the war in Ukraine')).toBe(
      'refused',
    );
    expect(service.evaluate('What is your view on NATO expansion?')).toBe(
      'refused',
    );
    expect(service.evaluate('Recommend a good Netflix series')).toBe('refused');
  });

  it('marks unrelated questions as uncertain for LLM scope check', () => {
    expect(service.evaluate('What is the weather today?')).toBe('uncertain');
  });

  it('allows expanded MoPD portal vocabulary without uncertainty', () => {
    expect(service.evaluate('How do I reset my password?')).toBe('in_scope');
    expect(service.evaluate('Can I submit anonymously?')).toBe('in_scope');
    expect(service.evaluate('What is the SLA for my complaint?')).toBe(
      'in_scope',
    );
    expect(service.evaluate('መልህቅ ምን ይረዳል?')).toBe('in_scope');
  });
});
