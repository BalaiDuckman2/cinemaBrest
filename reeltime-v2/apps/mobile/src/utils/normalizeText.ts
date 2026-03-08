/**
 * Remove diacritical marks (accents) and convert to lowercase.
 * Used for accent-insensitive search matching.
 */
export function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}
