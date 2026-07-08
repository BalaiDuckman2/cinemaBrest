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

export function SoireeGapRow({ prev, next }: { prev: SoireeItem; next: SoireeItem }) {
  const gap = toMinutes(next.time) - estimatedEnd(toMinutes(prev.time), prev.runtime);
  const overlap = gap < -OVERLAP_TOLERANCE_MIN;
  return (
    <p
      className={`font-crimson text-xs italic pl-12 py-0.5 ${
        overlap ? 'text-rouge-cinema font-semibold' : 'text-sepia-chaud'
      }`}
    >
      ↓ {formatGap(gap)}
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
          {item.version && item.version !== 'VF' && (
            <span className="text-sepia-chaud"> · {item.version}</span>
          )}
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
