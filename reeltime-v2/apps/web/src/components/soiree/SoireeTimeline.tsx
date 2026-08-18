import type { SoireeItem } from '../../stores/soireeStore';
import {
  estimatedEnd,
  toMinutes,
  formatClock,
  formatGap,
  OVERLAP_TOLERANCE_MIN,
} from '../../utils/chaining';
import { getCinemaShortName } from '../../utils/cinemaNames';

const NO_POSTER = '/images/no-poster.svg';

/** "18:10" -> "18h10" */
export function timeLabel(time: string): string {
  return time.replace(':', 'h');
}

/** Fin estimée "~20h25" (préfixe ~ si durée inconnue). */
export function endLabel(item: SoireeItem): string {
  const end = estimatedEnd(toMinutes(item.time), item.runtime);
  return `${item.runtime == null ? '~' : ''}${formatClock(end)}`;
}

export function SoireeGapRow({
  prev,
  next,
  travelMin = 0,
}: {
  prev: SoireeItem;
  next: SoireeItem;
  /** Trajet estimé entre les deux salles. Absent = aucun trajet compté. */
  travelMin?: number;
}) {
  const gap = toMinutes(next.time) - estimatedEnd(toMinutes(prev.time), prev.runtime);
  // Le libellé qualifie le temps LIBRE : annoncer « enchaînement direct » pour
  // cinq minutes de battement et un quart d'heure de marche serait faux.
  const slack = gap - travelMin;
  const overlap = slack < -OVERLAP_TOLERANCE_MIN;
  return (
    <p
      className={`font-crimson text-xs italic pl-12 py-0.5 ${
        overlap ? 'text-rouge-cinema font-semibold' : 'text-sepia-chaud'
      }`}
    >
      ↓ {formatGap(slack)}
      {travelMin > 0 ? ` · ~${travelMin} min de trajet` : ''}
      {prev.runtime == null ? ' (durée estimée)' : ''}
    </p>
  );
}

export function SoireeItemRow({ item, past, onRemove }: { item: SoireeItem; past: boolean; onRemove: () => void }) {
  return (
    <div
      className={`flex items-center gap-2.5 bg-creme-ecran border border-sepia-chaud/50 rounded-lg p-2 ${
        past ? 'opacity-50' : ''
      }`}
    >
      <img
        src={item.posterUrl ?? NO_POSTER}
        alt=""
        loading="lazy"
        decoding="async"
        className="w-9 h-[54px] object-cover rounded shadow flex-shrink-0 border border-sepia-chaud/50 bg-beige-papier"
        onError={(e) => { e.currentTarget.src = NO_POSTER; }}
      />
      <div className="flex-1 min-w-0">
        <p className="font-playfair font-bold text-noir-velours text-sm leading-tight truncate">
          {item.title}
        </p>
        <p className="font-bebas text-xs text-noir-velours tracking-wide">
          {timeLabel(item.time)} <span className="text-sepia-chaud">→ {endLabel(item)}</span>
          <span className="text-sepia-chaud"> · {getCinemaShortName(item.cinemaName)}</span>
          {/* La VF est une information comme une autre : la taire rendait les
              lignes sans mention ambiguës. */}
          {item.version && <span className="text-sepia-chaud"> · {item.version}</span>}
        </p>
        {item.bookingUrl && (
          <a
            href={item.bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-crimson text-xs text-rouge-cinema underline hover:text-bordeaux-profond"
          >
            Réserver
          </a>
        )}
      </div>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Retirer ${item.title} de ma soirée`}
        className="w-7 h-7 flex items-center justify-center text-sepia-chaud hover:text-rouge-cinema rounded-full hover:bg-beige-papier transition-colors shrink-0"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
