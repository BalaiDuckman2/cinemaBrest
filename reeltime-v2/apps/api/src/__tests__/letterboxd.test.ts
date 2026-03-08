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
});
