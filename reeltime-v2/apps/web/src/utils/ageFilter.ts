import type { MinAgeFilter } from '../stores/filtersStore';

/** Paliers du filtre d'âge, dans l'ordre du slider. L'index sert de valeur au curseur. */
export const MIN_AGE_VALUES: MinAgeFilter[] = [0, 1, 5, 10, 20, 30, 50];

export function ageIndexOf(value: MinAgeFilter): number {
  const index = MIN_AGE_VALUES.indexOf(value);
  return index === -1 ? 0 : index;
}

export function ageValueAt(index: number): MinAgeFilter {
  return MIN_AGE_VALUES[index] ?? 0;
}

export function ageLabel(value: MinAgeFilter): string {
  if (value === 0) return 'Tous les films';
  return `Films de +${value} an${value > 1 ? 's' : ''}`;
}
