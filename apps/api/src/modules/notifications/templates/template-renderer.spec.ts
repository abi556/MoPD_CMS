import { renderTemplate } from './template-renderer';

describe('renderTemplate', () => {
  it('substitutes variables', () => {
    const out = renderTemplate('Hello {{name}}, link {{url}}', {
      name: 'Ada',
      url: 'https://example.com',
    });
    expect(out).toBe('Hello Ada, link https://example.com');
  });

  it('replaces missing variables with empty string', () => {
    expect(renderTemplate('{{missing}}', {})).toBe('');
  });
});
