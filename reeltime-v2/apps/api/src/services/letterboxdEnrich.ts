// Pure parsers + network fetchers for Letterboxd enrichment (no Prisma here).

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

const TMDB_SEARCH_URL = 'https://api.themoviedb.org/3/search/movie';
const FETCH_TIMEOUT_MS = 10_000;

interface TmdbSearchResult {
  id?: unknown;
}
interface TmdbSearchResponse {
  results?: unknown;
}

/** Extract the TMDB movie id of the first search result, or null. */
export function extractTmdbId(json: unknown): number | null {
  const resp = json as TmdbSearchResponse | null;
  const results = resp?.results;
  if (!Array.isArray(results) || results.length === 0) return null;
  const first = results[0] as TmdbSearchResult;
  return typeof first.id === 'number' ? first.id : null;
}

const JSON_LD_RE = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/i;

/** Extract the Letterboxd average rating (0-5) from a film page HTML, or null. */
export function extractLetterboxdRating(html: string): number | null {
  const match = JSON_LD_RE.exec(html);
  if (!match) return null;
  const raw = match[1]
    .replace('/* <![CDATA[ */', '')
    .replace('/* ]]> */', '')
    .trim();
  try {
    const data = JSON.parse(raw) as { aggregateRating?: { ratingValue?: unknown } };
    const value = data.aggregateRating?.ratingValue;
    return typeof value === 'number' ? value : null;
  } catch {
    return null;
  }
}

async function fetchJsonWithTimeout(url: string): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    return await res.json();
  } finally {
    clearTimeout(timeout);
  }
}

/** Search TMDB for a film by title (+ optional year). Returns the TMDB id or null. */
export async function fetchTmdbId(
  apiKey: string,
  title: string,
  year: number | null,
): Promise<number | null> {
  const params = new URLSearchParams({
    api_key: apiKey,
    query: title,
    language: 'fr-FR',
    include_adult: 'false',
  });
  if (year != null) params.set('year', String(year));
  const json = await fetchJsonWithTimeout(`${TMDB_SEARCH_URL}?${params.toString()}`);
  return extractTmdbId(json);
}

/** Resolve a TMDB id to a Letterboxd film page and read its average rating (0-5), or null. */
export async function fetchLetterboxdRatingByTmdbId(tmdbId: number): Promise<number | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    // letterboxd.com/tmdb/{id}/ redirects (followed by fetch) to the canonical film page.
    const res = await fetch(`https://letterboxd.com/tmdb/${tmdbId}/`, {
      headers: { 'User-Agent': USER_AGENT },
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const html = await res.text();
    return extractLetterboxdRating(html);
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
