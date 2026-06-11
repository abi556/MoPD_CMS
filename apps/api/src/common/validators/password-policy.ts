/** SDS-aligned staff password rules (min 12 chars + character classes). */
export const PASSWORD_MIN_LENGTH = 12;

export const PASSWORD_POLICY_MESSAGE =
  'Password must be at least 12 characters and include uppercase, lowercase, a number, and a special character';

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
