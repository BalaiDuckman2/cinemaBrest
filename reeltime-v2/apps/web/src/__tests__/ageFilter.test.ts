import { describe, it, expect } from 'vitest';
import { MIN_AGE_VALUES, ageIndexOf, ageValueAt, ageLabel } from '../utils/ageFilter';
import type { MinAgeFilter } from '../stores/filtersStore';

describe('MIN_AGE_VALUES', () => {
  it('liste les 7 paliers dans l ordre croissant', () => {
    expect(MIN_AGE_VALUES).toEqual([0, 1, 5, 10, 20, 30, 50]);
  });
});

describe('ageIndexOf', () => {
  it('rend l index du palier', () => {
    expect(ageIndexOf(0)).toBe(0);
    expect(ageIndexOf(10)).toBe(3);
    expect(ageIndexOf(50)).toBe(6);
  });

  it('retombe sur 0 pour une valeur hors paliers', () => {
    expect(ageIndexOf(7 as MinAgeFilter)).toBe(0);
  });
});

describe('ageValueAt', () => {
  it('rend la valeur du palier', () => {
    expect(ageValueAt(0)).toBe(0);
    expect(ageValueAt(3)).toBe(10);
    expect(ageValueAt(6)).toBe(50);
  });

  it('retombe sur 0 hors bornes', () => {
    expect(ageValueAt(99)).toBe(0);
    expect(ageValueAt(-1)).toBe(0);
  });
});

describe('ageLabel', () => {
  it('emploie un libelle special pour le palier 0', () => {
    expect(ageLabel(0)).toBe('Tous les films');
  });

  it('emploie le nombre d annees pour les autres paliers', () => {
    expect(ageLabel(1)).toBe('Films de +1 an');
    expect(ageLabel(10)).toBe('Films de +10 ans');
  });
});
