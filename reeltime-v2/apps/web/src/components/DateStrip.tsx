import { useEffect, useRef } from 'react';
import { formatDayShort, localISODate } from '../utils/dates';

interface DateStripProps {
  /** Toutes les dates de la fenêtre (YYYY-MM-DD), aujourd'hui en tête. */
  dates: string[];
  /** Date sélectionnée, ou null pour toute la fenêtre. */
  value: string | null;
  onChange: (date: string | null) => void;
  /** Charge une semaine de plus. Masque la puce si absent. */
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
  /** Masque la puce « Tous » (planificateur de soirée : un jour est obligatoire). */
  hideAllChip?: boolean;
}

/** « sam. 26 » -> { day: 'sam.', num: '26' } pour l'affichage sur deux lignes. */
function splitDayLabel(date: string): { day: string; num: string } {
  const [day, num] = formatDayShort(date).split(' ');
  return { day, num };
}

export function DateStrip({
  dates,
  value,
  onChange,
  onLoadMore,
  isLoadingMore = false,
  hideAllChip = false,
}: DateStripProps) {
  const today = localISODate();
  const activeRef = useRef<HTMLButtonElement>(null);

  // Amène la puce active dans le viewport horizontal au montage, sans faire
  // défiler la page verticalement (block: 'nearest').
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest', inline: 'center' });
  }, []);

  const chipClass = (selected: boolean) =>
    `font-bebas shrink-0 snap-center flex flex-col items-center justify-center min-w-[52px] min-h-[48px] px-2 rounded-xl border-2 text-xs uppercase tracking-wide transition-colors ${
      selected
        ? 'bg-rouge-cinema border-bordeaux-profond text-creme-ecran shadow-md'
        : 'bg-creme-ecran border-sepia-chaud text-noir-velours hover:border-rouge-cinema'
    }`;

  return (
    <div
      className="flex gap-1.5 overflow-x-auto snap-x snap-proximity overscroll-x-contain pb-1"
      role="group"
      aria-label="Filtrer par jour"
    >
      {!hideAllChip && (
        <button
          type="button"
          ref={value === null ? activeRef : undefined}
          onClick={() => onChange(null)}
          aria-pressed={value === null}
          className={chipClass(value === null)}
        >
          <span>Tous</span>
          <span className="text-[11px] opacity-80 normal-case">{dates.length} j</span>
        </button>
      )}

      {dates.map((date) => {
        const { day, num } = splitDayLabel(date);
        const isToday = date === today;
        const selected = value === date;
        return (
          <button
            key={date}
            type="button"
            ref={selected ? activeRef : undefined}
            onClick={() => onChange(date)}
            aria-pressed={selected}
            aria-label={isToday ? "Aujourd'hui" : formatDayShort(date)}
            className={chipClass(selected)}
          >
            <span>{isToday ? 'Auj.' : day}</span>
            <span className="font-playfair text-base font-bold leading-none">{num}</span>
          </button>
        );
      })}

      {onLoadMore && (
        <button
          type="button"
          onClick={onLoadMore}
          disabled={isLoadingMore}
          className="font-bebas shrink-0 flex flex-col items-center justify-center min-w-[52px] min-h-[48px] px-2 rounded-xl border-2 border-dashed border-sepia-chaud bg-beige-papier text-sepia-chaud text-xs uppercase tracking-wide hover:border-rouge-cinema hover:text-rouge-cinema transition-colors disabled:opacity-50"
        >
          {isLoadingMore ? (
            <span>…</span>
          ) : (
            <>
              <span>+7</span>
              <span className="text-[11px] normal-case">jours</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}
