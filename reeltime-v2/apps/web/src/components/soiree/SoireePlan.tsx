import type { SoireeItem } from '../../stores/soireeStore';
import { SoireeItemRow, SoireeGapRow, timeLabel, endLabel } from './SoireeTimeline';
import { formatDayLong } from '../../utils/dates';

interface SoireePlanProps {
  date: string;
  items: SoireeItem[];
  today: string;
  now: string;
  /** Trajet entre deux salles, injecté pour que le composant reste sans dépendance réseau. */
  travelOf: (fromCinemaId: string, toCinemaId: string) => number;
  onRemove: (showtimeId: string) => void;
  onClear: () => void;
}

export function SoireePlan({
  date,
  items,
  today,
  now,
  travelOf,
  onRemove,
  onClear,
}: SoireePlanProps) {
  if (items.length === 0) {
    return (
      <div className="bg-beige-papier border-2 border-sepia-chaud rounded-xl p-3 sm:p-4 mb-4 text-center">
        <p className="text-2xl mb-1">🍿</p>
        <p className="font-crimson text-sm text-noir-velours">
          Ta soirée du {formatDayLong(date).toLowerCase()} est vide. Choisis une séance ci-dessous
          pour commencer — les films qui s'enchaînent avant et après apparaîtront ensuite.
        </p>
      </div>
    );
  }

  return (
    <section
      aria-label={`Ma soirée du ${formatDayLong(date)}`}
      className="bg-beige-papier border-2 border-sepia-chaud rounded-xl p-3 sm:p-4 mb-4 shadow-md"
    >
      <div className="flex items-baseline justify-between gap-2 flex-wrap mb-2">
        <h2 className="font-bebas text-noir-velours text-lg uppercase tracking-wider">
          🎟 Ma soirée
          <span className="font-crimson text-sm text-sepia-chaud italic normal-case tracking-normal">
            {' '}· {items.length} film{items.length > 1 ? 's' : ''} · {timeLabel(items[0].time)} →{' '}
            {endLabel(items[items.length - 1])}
          </span>
        </h2>
        <button
          type="button"
          onClick={onClear}
          className="font-bebas text-xs text-sepia-chaud hover:text-rouge-cinema uppercase tracking-wide transition-colors"
        >
          Tout effacer
        </button>
      </div>

      <div className="space-y-1.5">
        {items.map((item, idx) => (
          <div key={item.showtimeId}>
            {idx > 0 && (
              <SoireeGapRow
                prev={items[idx - 1]}
                next={item}
                travelMin={travelOf(items[idx - 1].cinemaId, item.cinemaId)}
              />
            )}
            <SoireeItemRow
              item={item}
              past={item.date === today && item.time < now}
              onRemove={() => onRemove(item.showtimeId)}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
