/**
 * RFC 4648 Base32 alphabet (A-Z and 2-7).
 * Single tunable constant for the Veil key alphabet.
 */
export const KEY_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/**
 * Total character count of a complete key.
 * Default is 56 characters: 52 payload key characters + 4 checksum characters.
 * TODO: Backend teammate must confirm the exact length, alphabet and checksum algorithm from PRD section 7.2.
 */
export const KEY_TOTAL_CHARS = 56;

/**
 * Normalizes a raw string into uppercase characters strictly within KEY_ALPHABET.
 * Strips whitespace, hyphens, and any unsupported characters.
 * Truncates at KEY_TOTAL_CHARS.
 */
export function normalizeKey(raw: string): string {
  if (!raw) return '';
  const upper = raw.toUpperCase();
  let normalized = '';
  for (let i = 0; i < upper.length; i++) {
    const char = upper[i];
    if (KEY_ALPHABET.includes(char)) {
      normalized += char;
      if (normalized.length === KEY_TOTAL_CHARS) {
        break;
      }
    }
  }
  return normalized;
}

/**
 * Formats a key into 4-character chunks separated by hyphens (e.g. XXXX-XXXX-XXXX-...).
 * Safe for partial input as the user types.
 */
export function formatKey(raw: string): string {
  const normalized = normalizeKey(raw);
  if (!normalized) return '';

  const chunks: string[] = [];
  for (let i = 0; i < normalized.length; i += 4) {
    chunks.push(normalized.slice(i, i + 4));
  }
  return chunks.join('-');
}

/**
 * Checks whether a key has reached the required total length.
 */
export function isKeyComplete(raw: string): boolean {
  return normalizeKey(raw).length === KEY_TOTAL_CHARS;
}

/**
 * Stub checksum validator.
 * STUB: The server is authoritative on the checksum and answers 400 for a malformed key.
 * Currently returns true for any complete key that matches the required length and alphabet.
 */
export function verifyKeyChecksum(raw: string): boolean {
  const normalized = normalizeKey(raw);
  if (normalized.length !== KEY_TOTAL_CHARS) {
    return false;
  }
  // All characters are verified against KEY_ALPHABET
  for (let i = 0; i < normalized.length; i++) {
    if (!KEY_ALPHABET.includes(normalized[i])) {
      return false;
    }
  }
  return true;
}

/**
 * Formats a key for screen readers with spaced characters and pauses between groups.
 * Example: "K 7 Q M, 2 V X D, ..."
 */
export function formatKeyForSpeech(formattedKey: string): string {
  if (!formattedKey) return '';
  const groups = formattedKey.split('-');
  return groups
    .map((group) => group.split('').join(' '))
    .filter(Boolean)
    .join(', ');
}

/**
 * Calculates the new caret position in a formatted key string given the previous value,
 * the newly input raw value, and the cursor position in that input before formatting.
 * Prevents the caret from jumping to the end when editing in the middle.
 */
export function calculateCaretPosition(
  inputVal: string,
  cursorInInput: number
): number {
  // Count how many valid alphabet characters were before the cursor
  const textBeforeCursor = inputVal.slice(0, cursorInInput).toUpperCase();
  let validCharsBefore = 0;
  for (let i = 0; i < textBeforeCursor.length; i++) {
    if (KEY_ALPHABET.includes(textBeforeCursor[i])) {
      validCharsBefore++;
      if (validCharsBefore === KEY_TOTAL_CHARS) {
        break;
      }
    }
  }

  if (validCharsBefore === 0) {
    return 0;
  }

  // Determine where that many valid characters land in the formatted string
  // Formatted string has hyphens after every 4 characters (at index 4, 9, 14, etc.)
  // Number of hyphens before this valid char count = Math.floor((validCharsBefore - 1) / 4)
  const hyphensBefore = Math.floor((validCharsBefore - 1) / 4);
  return validCharsBefore + hyphensBefore;
}
