import { useFiltersStore } from '../../stores/filtersStore';
import { formatTimeLabel, toHHMM, toMinutes, type TimeRange } from '../../utils/timeRange';
import { Slider } from './Slider';

const STEP_MINUTES = 15;

export function TimeRangeSlider({ bounds }: { bounds: TimeRange | null }) {
  const timeRange = useFiltersStore((s) => s.timeRange);
  const setTimeRange = useFiltersStore((s) => s.setTimeRange);
  const ceSoirMode = useFiltersStore((s) => s.ceSoirMode);

  // Aucune séance ce jour-là : il n'y a pas de bornes, donc rien à régler.
  if (!bounds) return null;

  const minMinutes = toMinutes(bounds.start);
  const maxMinutes = toMinutes(bounds.end);
  const current = timeRange ?? bounds;

  const handleChange = ([start, end]: number[]) => {
    // Revenir aux bornes complètes équivaut à retirer le filtre : on repasse à
    // null pour que l'étiquette de filtre actif disparaisse aussi.
    if (start === minMinutes && end === maxMinutes) {
      setTimeRange(null);
      return;
    }
    setTimeRange({ start: toHHMM(start), end: toHHMM(end) });
  };

  return (
    <div className="space-y-1">
      <span className="font-bebas text-xs text-sepia-chaud uppercase tracking-wide">Horaires</span>
      <Slider
        value={[toMinutes(current.start), toMinutes(current.end)]}
        onValueChange={handleChange}
        min={minMinutes}
        max={maxMinutes}
        step={STEP_MINUTES}
        disabled={ceSoirMode}
        ariaLabels={['Heure de début', 'Heure de fin']}
      />
      <p className="font-bebas text-sm text-noir-velours">
        {ceSoirMode
          ? 'Désactivé par le mode « Ce soir »'
          : `De ${formatTimeLabel(current.start)} à ${formatTimeLabel(current.end)}`}
      </p>
    </div>
  );
}
