import { formatDayShort, localISODate } from '../utils/dates';

interface DayStripProps {
  /** The 7 dates (YYYY-MM-DD) of the displayed week. */
  dates: string[];
  /** Selected date, or null for the whole week. */
  value: string | null;
  onChange: (date: string | null) => void;
  /** Hide the "whole week" chip (e.g. on the evening planner where a day is mandatory). */
  hideAllChip?: boolean;
}

export function DayStrip({ dates, value, onChange, hideAllChip = false }: DayStripProps) {
  const today = localISODate();

  const chipClass = (selected: boolean, disabled: boolean) =>
    `font-bebas shrink-0 px-3 py-1.5 rounded-full border-2 text-xs sm:text-sm uppercase tracking-wide transition-colors ${
      selected
        ? 'bg-rouge-cinema border-bordeaux-profond text-creme-ecran shadow-md'
        : disabled
          ? 'bg-beige-papier border-sepia-chaud/30 text-sepia-chaud/40 cursor-not-allowed'
          : 'bg-creme-ecran border-sepia-chaud text-noir-velours hover:border-rouge-cinema'
    }`;

  return (
    <div
      className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-1 -mx-2 px-2 sm:mx-0 sm:px-0"
      role="group"
      aria-label="Filtrer par jour"
    >
      {!hideAllChip && (
        <button
          type="button"
          onClick={() => onChange(null)}
          aria-pressed={value === null}
          className={chipClass(value === null, false)}
        >
          Tous
        </button>
      )}
      {dates.map((date) => {
        const isPast = date < today;
        const isToday = date === today;
        return (
          <button
            key={date}
            type="button"
            disabled={isPast}
            onClick={() => onChange(date)}
            aria-pressed={value === date}
            className={chipClass(value === date, isPast)}
          >
            {isToday ? "Aujourd'hui" : formatDayShort(date)}
          </button>
        );
      })}
    </div>
  );
}
