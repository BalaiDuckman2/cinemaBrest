import { useFiltersStore } from '../../stores/filtersStore';

const RATING_OPTIONS: Array<{ label: string; value: number | null }> = [
  { label: 'Note', value: null },
];

for (let r = 1; r <= 5; r += 0.5) {
  RATING_OPTIONS.push({ label: `${r}+`, value: r });
}

export function RatingFilter() {
  const minRating = useFiltersStore((s) => s.minRating);
  const setMinRating = useFiltersStore((s) => s.setMinRating);

  return (
    <select
      value={minRating ?? ''}
      onChange={(e) => setMinRating(e.target.value ? Number(e.target.value) : null)}
      aria-label="Note minimum"
      className="rounded border-2 border-beige-papier bg-creme-ecran px-3 py-1 font-bebas text-label tracking-wider text-noir-velours transition-colors focus:border-rouge-cinema focus:outline-none"
    >
      {RATING_OPTIONS.map((opt) => (
        <option key={opt.label} value={opt.value ?? ''}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
