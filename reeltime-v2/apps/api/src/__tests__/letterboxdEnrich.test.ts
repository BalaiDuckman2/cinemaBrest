import { describe, it, expect } from 'vitest';
import { extractTmdbId, extractLetterboxdRating } from '../services/letterboxdEnrich.js';

describe('extractTmdbId', () => {
  it('returns the id of the first result', () => {
    const json = { results: [{ id: 777, title: 'A' }, { id: 888, title: 'B' }] };
    expect(extractTmdbId(json)).toBe(777);
  });

  it('returns null when results is empty', () => {
    expect(extractTmdbId({ results: [] })).toBeNull();
  });

  it('returns null when results is missing or malformed', () => {
    expect(extractTmdbId({})).toBeNull();
    expect(extractTmdbId(null)).toBeNull();
    expect(extractTmdbId({ results: [{ title: 'no id' }] })).toBeNull();
  });
});

describe('extractLetterboxdRating', () => {
  const page = (jsonLd: string) =>
    `<html><head><script type="application/ld+json">\n/* <![CDATA[ */\n${jsonLd}\n/* ]]> */\n</script></head></html>`;

  it('reads ratingValue from the JSON-LD aggregateRating', () => {
    const html = page(
      JSON.stringify({ '@type': 'Movie', aggregateRating: { ratingValue: 3.86, ratingCount: 1200 } }),
    );
    expect(extractLetterboxdRating(html)).toBe(3.86);
  });

  it('returns null when there is no aggregateRating', () => {
    const html = page(JSON.stringify({ '@type': 'Movie' }));
    expect(extractLetterboxdRating(html)).toBeNull();
  });

  it('returns null when there is no JSON-LD script', () => {
    expect(extractLetterboxdRating('<html><body>nope</body></html>')).toBeNull();
  });

  it('returns null on malformed JSON', () => {
    const html = '<script type="application/ld+json">/* <![CDATA[ */ {bad json} /* ]]> */</script>';
    expect(extractLetterboxdRating(html)).toBeNull();
  });
});
