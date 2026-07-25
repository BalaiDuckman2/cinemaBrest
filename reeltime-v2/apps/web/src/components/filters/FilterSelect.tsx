import { SelectSheet } from '../ui/SelectSheet';
import type { FilterOption } from './filterOptions';

interface FilterSelectProps {
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
  label: string;
}

const SELECT_CLASS =
  'font-crimson w-full px-2 py-2 bg-creme-ecran border-2 border-sepia-chaud rounded-lg text-noir-velours text-xs focus:outline-none focus:border-rouge-cinema focus:ring-2 focus:ring-rouge-cinema/20';

/**
 * Un réglage de filtre, rendu en feuille basse sur mobile et en select natif
 * sur desktop, à partir de la même liste d'options.
 */
export function FilterSelect({ value, options, onChange, label }: FilterSelectProps) {
  return (
    <>
      <SelectSheet
        value={value}
        options={options}
        onChange={onChange}
        label={label}
        className="md:hidden"
      />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        className={`hidden md:block ${SELECT_CLASS}`}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </>
  );
}
