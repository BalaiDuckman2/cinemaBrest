import { describe, it, expect } from 'vitest';
import {
  cinemaIdsForCity,
  cinemasForCity,
  defaultCityLabel,
  isOptInCity,
} from '../utils/cinemaFilter';

const CINEMAS = [
  { id: 'P0153', city: 'Brest' },
  { id: 'P0151', city: 'Brest' },
  { id: 'G02PD', city: 'Landerneau' },
  { id: 'P0633', city: 'Quimper' },
  { id: 'P0983', city: 'Troyes' },
  { id: 'W1015', city: 'Troyes' },
];

describe('cinemaIdsForCity', () => {
  it('rend les identifiants des cinemas de la ville', () => {
    expect(cinemaIdsForCity(CINEMAS, 'Brest')).toEqual(['P0153', 'P0151']);
  });

  it('ecarte les villes hors zone quand aucune ville n est choisie', () => {
    expect(cinemaIdsForCity(CINEMAS, null)).toEqual(['P0153', 'P0151', 'G02PD', 'P0633']);
  });

  it('rend les cinemas d une ville hors zone quand elle est choisie', () => {
    expect(cinemaIdsForCity(CINEMAS, 'Troyes')).toEqual(['P0983', 'W1015']);
  });

  it('rend null tant que la liste des cinemas n est pas chargee', () => {
    expect(cinemaIdsForCity([], null)).toBeNull();
  });

  it('rend un tableau vide pour une ville sans cinema', () => {
    expect(cinemaIdsForCity(CINEMAS, 'Rennes')).toEqual([]);
  });
});

describe('cinemasForCity', () => {
  it('rend les cinemas eux-memes, pas leurs identifiants', () => {
    expect(cinemasForCity(CINEMAS, 'Troyes')).toEqual([
      { id: 'P0983', city: 'Troyes' },
      { id: 'W1015', city: 'Troyes' },
    ]);
  });

  it('exclut les villes hors zone par defaut', () => {
    expect(cinemasForCity(CINEMAS, null).map((c) => c.city)).not.toContain('Troyes');
  });
});

describe('isOptInCity', () => {
  it('reconnait Troyes comme ville hors zone', () => {
    expect(isOptInCity('Troyes')).toBe(true);
    expect(isOptInCity('Brest')).toBe(false);
  });
});

describe('defaultCityLabel', () => {
  it('annonce les villes ecartees', () => {
    expect(defaultCityLabel(['Brest', 'Quimper', 'Troyes'])).toBe('Toutes sauf Troyes');
  });

  it('reste generique quand aucune ville hors zone n est presente', () => {
    expect(defaultCityLabel(['Brest', 'Quimper'])).toBe('Toutes les villes');
  });
});
