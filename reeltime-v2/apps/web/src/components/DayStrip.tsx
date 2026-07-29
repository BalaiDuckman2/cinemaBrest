import { useEffect, useRef } from 'react';
import { formatDayShort, localISODate } from '../utils/dates';

interface DayStripProps {
  /** Les 7 dates (YYYY-MM-DD) de la semaine affichée, lundi -> dimanche. */
  dates: string[];
  /** Date sélectionnée, ou null pour toute la semaine. */
  value: string | null;
  onChange: (date: string | null) => void;
  /** Masque la puce « Tous » (planificateur de soirée : un jour est obligatoire). */
  hideAllChip?: boolean;
}

/** « sam. 26 » -> { day: 'sam.', num: '26' } pour l'affichage sur deux lignes. */
function splitDayLabel(date: string): { day: string; num: string } {
  const [day, num] = formatDayShort(date).split(' ');
  return { day, num };
}

export function DayStrip({ dates, value, onChange, hideAllChip = false }: DayStripProps) {
  const today = localISODate();
  const activeRef = useRef<HTMLButtonElement>(null);

  // Amène la puce active dans le viewport horizontal au montage, sans faire
  // défiler la page verticalement (block: 'nearest').
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest', inline: 'center' });
  }, []);

  const chipClass = (selected: boolean, disabled: boolean) =>
    `font-bebas shrink-0 snap-center flex flex-col items-center justify-center min-w-[52px] min-h-[48px] px-2 rounded-xl border-2 text-xs uppercase tracking-wide transition-colors ${
      selected
        ? 'bg-rouge-cinema border-bordeaux-profond text-creme-ecran shadow-md'
        : disabled
          ? 'bg-beige-papier border-sepia-chaud/30 text-sepia-chaud/40 cursor-not-allowed'
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
          className={chipClass(value === null, false)}
        >
          <span>Tous</span>
          <span className="text-[11px] opacity-80 normal-case">semaine</span>
        </button>
      )}

      {dates.map((date) => {
        const { day, num } = splitDayLabel(date);
        const isToday = date === today;
        const isPast = date < today;
        const selected = value === date;
        return (
          <button
            key={date}
            type="button"
            ref={selected ? activeRef : undefined}
            disabled={isPast}
            onClick={() => onChange(date)}
            aria-pressed={selected}
            aria-label={isToday ? "Aujourd'hui" : formatDayShort(date)}
            className={chipClass(selected, isPast)}
          >
            <span>{isToday ? 'Auj.' : day}</span>
            <span className="font-playfair text-base font-bold leading-none">{num}</span>
          </button>
        );
      })}
    </div>
  );
}
