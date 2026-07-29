import { describe, it, expect } from 'vitest';
import { generateLetterboxdUrl } from '../utils/letterboxd.js';

describe('generateLetterboxdUrl', () => {
  it('generates URL for a normal title', () => {
    expect(generateLetterboxdUrl('Nosferatu')).toBe(
      'https://letterboxd.com/search/films/nosferatu/',
    );
  });

  it('replaces accented characters', () => {
    expect(generateLetterboxdUrl('Amélie Poulain')).toBe(
      'https://letterboxd.com/search/films/amelie%20poulain/',
    );
  });

  it('strips special characters (\' : . , ! ?)', () => {
    expect(generateLetterboxdUrl("L'Étoile de Noël!")).toBe(
      'https://letterboxd.com/search/films/letoile%20de%20noel/',
    );
  });

  it('collapses multiple spaces', () => {
    expect(generateLetterboxdUrl('The   Big   Film')).toBe(
      'https://letterboxd.com/search/films/the%20big%20film/',
    );
  });

  it('handles title with mixed accents and special chars', () => {
    const url = generateLetterboxdUrl("Le Château de l'Araignée");
    expect(url).toBe('https://letterboxd.com/search/films/le%20chateau%20de%20laraignee/');
  });

  // letterboxd.com/tmdb/{id}/ redirects to the canonical film page: when the
  // enrichment already resolved the film on TMDB, link straight to it instead
  // of dumping the user on a search results page.
  it('links directly to the film page when the TMDB id is known', () => {
    expect(generateLetterboxdUrl('Nosferatu', 426063)).toBe(
      'https://letterboxd.com/tmdb/426063/',
    );
  });

  it('ignores the title entirely when the TMDB id is known', () => {
    expect(generateLetterboxdUrl("L'Étoile de Noël!", 1)).toBe(
      'https://letterboxd.com/tmdb/1/',
    );
  });

  it('falls back to search when the TMDB id is null or undefined', () => {
    expect(generateLetterboxdUrl('Nosferatu', null)).toBe(
      'https://letterboxd.com/search/films/nosferatu/',
    );
    expect(generateLetterboxdUrl('Nosferatu', undefined)).toBe(
      'https://letterboxd.com/search/films/nosferatu/',
    );
  });
});
