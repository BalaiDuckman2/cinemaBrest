import { useFiltersStore } from '../../stores/filtersStore';

const TIME_OPTIONS: Array<{ label: string; value: string | null }> = [
  { label: 'Horaire', value: null },
];

// Generate 30-minute increments from 10:00 to 22:00
for (let h = 10; h <= 22; h++) {
  for (const m of ['00', '30']) {
    if (h === 22 && m === '30') break;
    const time = `${String(h).padStart(2, '0')}:${m}`;
    TIME_OPTIONS.push({ label: `${h}h${m === '00' ? '' : m}`, value: time });
  }
}

export function TimeFilter() {
  const minTime = useFiltersStore((s) => s.minTime);
  const setMinTime = useFiltersStore((s) => s.setMinTime);

  return (
    <select
      value={minTime ?? ''}
      onChange={(e) => setMinTime(e.target.value || null)}
      aria-label="Horaire minimum"
      className="rounded border-2 border-beige-papier bg-creme-ecran px-3 py-1 font-bebas text-label tracking-wider text-noir-velours transition-colors focus:border-rouge-cinema focus:outline-none"
    >
      {TIME_OPTIONS.map((opt) => (
        <option key={opt.label} value={opt.value ?? ''}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
