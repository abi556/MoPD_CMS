export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function isStrongPassword(value: string): boolean {
  return value.trim().length >= 8;
}

export function hasNonEmptyValue(value: string): boolean {
  return value.trim().length > 0;
}
