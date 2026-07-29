const ACCENT_MAP: Record<string, string> = {
  'é': 'e', 'è': 'e', 'ê': 'e', 'ë': 'e',
  'à': 'a', 'â': 'a', 'ä': 'a',
  'ô': 'o', 'ö': 'o',
  'ù': 'u', 'û': 'u', 'ü': 'u',
  'ç': 'c',
  'î': 'i', 'ï': 'i',
};

const STRIP_CHARS = /[':.,!?]/g;

/**
 * Lien Letterboxd d'un film. Avec un `tmdbId` (posé par l'enrichissement), on
 * pointe la page du film : `letterboxd.com/tmdb/{id}/` redirige vers l'URL
 * canonique. Sans lui, on retombe sur une recherche par titre — c'est le cas
 * des films pas encore enrichis ou introuvables sur TMDB.
 */
export function generateLetterboxdUrl(title: string, tmdbId?: number | null): string {
  if (tmdbId != null) return `https://letterboxd.com/tmdb/${tmdbId}/`;

  let clean = title.toLowerCase();

  // Replace accented characters
  for (const [accent, replacement] of Object.entries(ACCENT_MAP)) {
    clean = clean.replaceAll(accent, replacement);
  }

  // Strip special characters
  clean = clean.replace(STRIP_CHARS, '');

  // Collapse multiple spaces
  clean = clean.replace(/\s{2,}/g, ' ').trim();

  return `https://letterboxd.com/search/films/${encodeURIComponent(clean)}/`;
}
