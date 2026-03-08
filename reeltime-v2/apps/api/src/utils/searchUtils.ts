/**
 * Normalize text for accent-insensitive, case-insensitive comparison.
 */
export function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Check if `text` contains `query` after normalization.
 * Supports partial matching (e.g., "nosf" matches "Nosferatu").
 */
export function matchesSearch(text: string, query: string): boolean {
  return normalizeText(text).includes(normalizeText(query));
}
