import { useEffect, useState } from 'react';
import { useSoireeStore, type SoireeItem } from '../../stores/soireeStore';
import {
  estimatedEnd,
  toMinutes,
  formatClock,
  formatGap,
  OVERLAP_TOLERANCE_MIN,
} from '../../utils/chaining';
import { formatDayShort, localISODate, nowHHMM } from '../../utils/dates';
import { getCinemaShortName } from '../../utils/cinemaNames';

const NO_POSTER = '/images/no-poster.svg';

/** "18:10" -> "18h10" */
function timeLabel(time: string): string {
  return time.replace(':', 'h');
}

/** Fin estimée "~20h25" (préfixe ~ si durée inconnue). */
function endLabel(item: SoireeItem): string {
  const end = estimatedEnd(toMinutes(item.time), item.runtime);
  return `${item.runtime == null ? '~' : ''}${formatClock(end)}`;
}

function GapRow({ prev, next }: { prev: SoireeItem; next: SoireeItem }) {
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

function ItemRow({ item, past, onRemove }: { item: SoireeItem; past: boolean; onRemove: () => void }) {
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

export function SoireeBar() {
  const date = useSoireeStore((s) => s.date);
  const items = useSoireeStore((s) => s.items);
  const remove = useSoireeStore((s) => s.remove);
  const clear = useSoireeStore((s) => s.clear);
  const purgeExpired = useSoireeStore((s) => s.purgeExpired);
  const [expanded, setExpanded] = useState(false);

  // Auto-expiration : purge au montage de l'app si le plan date d'hier ou avant.
  useEffect(() => {
    purgeExpired(localISODate());
  }, [purgeExpired]);

  if (items.length === 0 || !date) return null;

  const today = localISODate();
  const now = nowHHMM();
  const multiCity = new Set(items.map((i) => i.city).filter((c) => c !== '')).size > 1;
  const first = items[0];
  const last = items[items.length - 1];

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 sm:inset-x-auto sm:right-4 sm:bottom-4 sm:w-[28rem] sm:max-w-[calc(100vw-2rem)]">
      <div className="bg-beige-papier border-t-2 sm:border-2 border-sepia-chaud sm:rounded-xl shadow-2xl pb-[env(safe-area-inset-bottom)]">
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          aria-expanded={expanded}
          className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left"
        >
          <span className="font-bebas text-noir-velours text-sm uppercase tracking-wide truncate">
            🎟 Ma soirée · {formatDayShort(date)} · {items.length} film{items.length > 1 ? 's' : ''} ·{' '}
            {timeLabel(first.time)} → {endLabel(last)}
            {multiCity && <span className="text-rouge-cinema"> ⚠</span>}
          </span>
          <svg
            className={`w-5 h-5 text-sepia-chaud shrink-0 transform transition-transform ${
              expanded ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
          </svg>
        </button>

        {expanded && (
          <div className="px-3 pb-3 max-h-[55vh] overflow-y-auto border-t border-sepia-chaud/30 pt-2 space-y-1.5">
            {multiCity && (
              <p className="font-crimson text-xs italic text-rouge-cinema">⚠ villes différentes</p>
            )}

            {/* Task 8 : section « + un film avant » ici */}

            {items.map((item, idx) => (
              <div key={item.showtimeId}>
                {idx > 0 && <GapRow prev={items[idx - 1]} next={item} />}
                <ItemRow
                  item={item}
                  past={item.date === today && item.time < now}
                  onRemove={() => remove(item.showtimeId)}
                />
              </div>
            ))}

            {/* Task 8 : section « + un film après » ici */}

            <div className="pt-1 flex justify-end">
              <button
                type="button"
                onClick={clear}
                className="font-bebas text-xs text-sepia-chaud hover:text-rouge-cinema uppercase tracking-wide transition-colors"
              >
                Tout effacer
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
