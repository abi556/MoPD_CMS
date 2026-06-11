import { isStrongPassword } from './password-policy';

describe('password-policy', () => {
  it('accepts passwords meeting all rules', () => {
    expect(isStrongPassword('BrandNewPass456!')).toBe(true);
    expect(isStrongPassword('AdminPass123!')).toBe(true);
  });

  it('rejects passwords shorter than 12 characters', () => {
    expect(isStrongPassword('Short1!')).toBe(false);
  });

  it('rejects passwords missing character classes', () => {
    expect(isStrongPassword('alllowercase12!')).toBe(false);
    expect(isStrongPassword('ALLUPPERCASE12!')).toBe(false);
    expect(isStrongPassword('NoDigitsHere!!')).toBe(false);
    expect(isStrongPassword('NoSpecialChar12')).toBe(false);
  });
});
