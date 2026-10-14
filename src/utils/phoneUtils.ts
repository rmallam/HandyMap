/**
 * Phone Number Utilities for Australian 10-Digit Standards
 * Supports Mobiles (04XX XXX XXX) and Landlines (0X XXXX XXXX)
 */

/**
 * Extracts only digits from an input string, converting +61 international format to 0.
 * Caps at exactly 10 digits to prevent endless confusing inputs.
 */
export function cleanPhoneNumber(input?: string | null): string {
  if (!input) return '';
  let str = input.trim();
  if (str.startsWith('+61')) {
    str = '0' + str.slice(3);
  }
  return str.replace(/\D/g, '').slice(0, 10);
}

/**
 * Formats a phone string into clean Australian spacing:
 * - Mobile: 0412 345 678 (10 digits)
 * - Landline: 03 9123 4567 (10 digits)
 * - Generic: 0412 345 678
 */
export function formatPhoneNumber(input?: string | null): string {
  const digits = cleanPhoneNumber(input);
  if (!digits) return '';

  // Mobile format: 04XX XXX XXX
  if (digits.startsWith('04')) {
    if (digits.length <= 4) return digits;
    if (digits.length <= 7) return `${digits.slice(0, 4)} ${digits.slice(4)}`;
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 10)}`;
  }

  // Landline format: 0X XXXX XXXX (e.g., 03, 02, 07, 08)
  if (digits.startsWith('0') && digits.length >= 2 && !digits.startsWith('04')) {
    if (digits.length <= 2) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 2)} ${digits.slice(2)}`;
    return `${digits.slice(0, 2)} ${digits.slice(2, 6)} ${digits.slice(6, 10)}`;
  }

  // Standard fallback
  if (digits.length <= 4) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 4)} ${digits.slice(4)}`;
  return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 10)}`;
}

/**
 * Checks whether an input has exactly 10 digits.
 */
export function isValid10DigitPhone(input?: string | null): boolean {
  if (!input) return false;
  return cleanPhoneNumber(input).length === 10;
}

/**
 * Returns digit count out of 10.
 */
export function getPhoneDigitCount(input?: string | null): number {
  return cleanPhoneNumber(input).length;
}
