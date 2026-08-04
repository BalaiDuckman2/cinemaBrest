import { useFiltersStore } from '../../stores/filtersStore';
import { MIN_AGE_VALUES, ageIndexOf, ageValueAt, ageLabel } from '../../utils/ageFilter';
import { Slider } from './Slider';

export function AgeSlider() {
  const minAge = useFiltersStore((s) => s.minAge);
  const setMinAge = useFiltersStore((s) => s.setMinAge);

  return (
    <div className="space-y-1">
      <span className="font-bebas text-xs text-sepia-chaud uppercase tracking-wide">
        Âge du film
      </span>
      <Slider
        value={[ageIndexOf(minAge)]}
        onValueChange={([index]) => setMinAge(ageValueAt(index))}
        min={0}
        max={MIN_AGE_VALUES.length - 1}
        ariaLabels={['Âge minimum du film']}
      />
      <p className="font-bebas text-sm text-noir-velours">{ageLabel(minAge)}</p>
    </div>
  );
}
