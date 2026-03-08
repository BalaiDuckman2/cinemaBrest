const ACCENT_MAP: Record<string, string> = {
  'é': 'e', 'è': 'e', 'ê': 'e', 'ë': 'e',
  'à': 'a', 'â': 'a', 'ä': 'a',
  'ô': 'o', 'ö': 'o',
  'ù': 'u', 'û': 'u', 'ü': 'u',
  'ç': 'c',
  'î': 'i', 'ï': 'i',
};

const STRIP_CHARS = /[':.,!?]/g;

export function generateLetterboxdUrl(title: string): string {
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
