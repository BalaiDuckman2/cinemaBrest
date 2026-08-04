import { describe, it, expect } from 'vitest';
import { cinemaIdsForCity } from '../utils/cinemaFilter';

const CINEMAS = [
  { id: 'P0153', city: 'Brest' },
  { id: 'P0151', city: 'Brest' },
  { id: 'G02PD', city: 'Landerneau' },
  { id: 'P0633', city: 'Quimper' },
];

describe('cinemaIdsForCity', () => {
  it('rend les identifiants des cinemas de la ville', () => {
    expect(cinemaIdsForCity(CINEMAS, 'Brest')).toEqual(['P0153', 'P0151']);
  });

  it('rend null quand aucune ville n est choisie', () => {
    expect(cinemaIdsForCity(CINEMAS, null)).toBeNull();
  });

  it('rend un tableau vide pour une ville sans cinema', () => {
    expect(cinemaIdsForCity(CINEMAS, 'Rennes')).toEqual([]);
  });
});
