import { describe, it, expect } from 'vitest';
import { CINEMAS, getCinemaByAllocineId } from '../config/cinemas.js';

describe('CINEMAS config', () => {
  it('defines exactly 5 cinemas', () => {
    expect(CINEMAS).toHaveLength(5);
  });

  it('each cinema has required fields', () => {
    for (const cinema of CINEMAS) {
      expect(cinema.allocineId).toBeTruthy();
      expect(cinema.name).toBeTruthy();
      expect(cinema.city).toBeTruthy();
      expect(cinema.address).toBeTruthy();
      expect(typeof cinema.latitude).toBe('number');
      expect(typeof cinema.longitude).toBe('number');
    }
  });

  it('includes Brest and Landerneau cinemas', () => {
    const cities = new Set(CINEMAS.map((c) => c.city));
    expect(cities.has('Brest')).toBe(true);
    expect(cities.has('Landerneau')).toBe(true);
  });

  it('all allocineIds are unique', () => {
    const ids = CINEMAS.map((c) => c.allocineId);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('getCinemaByAllocineId', () => {
  it('finds Les Studios by P0153', () => {
    const cinema = getCinemaByAllocineId('P0153');
    expect(cinema).toBeDefined();
    expect(cinema!.name).toBe('Les Studios');
  });

  it('finds Ciné Galaxy by G02PD', () => {
    const cinema = getCinemaByAllocineId('G02PD');
    expect(cinema).toBeDefined();
    expect(cinema!.name).toBe('Ciné Galaxy');
    expect(cinema!.city).toBe('Landerneau');
  });

  it('returns undefined for unknown id', () => {
    expect(getCinemaByAllocineId('UNKNOWN')).toBeUndefined();
  });

  it('returns undefined for empty string', () => {
    expect(getCinemaByAllocineId('')).toBeUndefined();
  });
});
