export interface FilterOption {
  value: string;
  label: string;
}

export const SORT_OPTIONS: FilterOption[] = [
  { value: 'popularity', label: 'Popularité' },
  { value: 'letterboxd', label: 'Letterboxd ★' },
  { value: 'alphabetical', label: 'A→Z' },
  { value: 'year-desc', label: '+ Récent' },
  { value: 'year-asc', label: '+ Ancien' },
  { value: 'showtimes', label: 'Nb séances' },
];

export const VERSION_OPTIONS: FilterOption[] = [
  { value: 'all', label: 'Toutes versions' },
  { value: 'VF', label: 'VF' },
  { value: 'VO', label: 'VO/VOST' },
];

export const DEPARTMENTS = [
  { label: 'Finistère (29)', cities: ['Brest', 'Landerneau', 'Morlaix', 'Quimper'] },
];
