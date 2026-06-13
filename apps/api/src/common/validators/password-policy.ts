/** Staff password rules: min 8 chars + character classes (12+ recommended with MFA). */
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_RECOMMENDED_LENGTH = 12;

export const PASSWORD_POLICY_MESSAGE =
  'Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character (12+ characters recommended)';

const HAS_UPPERCASE = /[A-Z]/;
const HAS_LOWERCASE = /[a-z]/;
const HAS_DIGIT = /\d/;
const HAS_SPECIAL = /[^A-Za-z0-9]/;

export function isStrongPassword(password: string): boolean {
  if (typeof password !== 'string') {
    return false;
  }
  if (password.length < PASSWORD_MIN_LENGTH) {
    return false;
  }
  return (
    HAS_UPPERCASE.test(password) &&
    HAS_LOWERCASE.test(password) &&
    HAS_DIGIT.test(password) &&
    HAS_SPECIAL.test(password)
  );
}
