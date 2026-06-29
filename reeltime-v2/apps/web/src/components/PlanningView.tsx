import { useMemo } from 'react';
import type { FilmListItem, ShowtimeEntry } from '../types/components';
import { formatDayLong, localISODate } from '../utils/dates';
import { getCinemaShortName } from '../utils/cinemaNames';

const NO_POSTER = '/images/no-poster.svg';

interface PlanningViewProps {
  films: FilmListItem[];
  /** The 7 dates (YYYY-MM-DD) of the displayed week. */
  dates: string[];
  onFilmClick: (film: FilmListItem) => void;
}

interface DayEntry {
  film: FilmListItem;
  showtimes: ShowtimeEntry[];
  firstTime: string;
}

function formatRuntime(minutes: number | null): string {
  if (minutes == null || minutes <= 0) return '';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h${String(m).padStart(2, '0')}` : `${m}min`;
}

export function PlanningView({ films, dates, onFilmClick }: PlanningViewProps) {
  const today = localISODate();

  const byDate = useMemo(() => {
    const map = new Map<string, DayEntry[]>();
    for (const film of films) {
      const grouped = new Map<string, ShowtimeEntry[]>();
      for (const st of film.showtimes) {
        const date = st.datetime.slice(0, 10);
        if (!grouped.has(date)) grouped.set(date, []);
        grouped.get(date)!.push(st);
      }
      for (const [date, showtimes] of grouped) {
        showtimes.sort((a, b) => a.time.localeCompare(b.time));
        if (!map.has(date)) map.set(date, []);
        map.get(date)!.push({ film, showtimes, firstTime: showtimes[0].time });
      }
    }
    for (const entries of map.values()) {
      entries.sort((a, b) => a.firstTime.localeCompare(b.firstTime));
    }
    return map;
  }, [films]);

  const visibleDates = dates.filter((date) => byDate.has(date));

  if (visibleDates.length === 0) return null;

  return (
    <div className="space-y-6">
      {visibleDates.map((date) => {
        const entries = byDate.get(date)!;
        return (
          <section key={date} aria-label={formatDayLong(date)}>
            <h2 className="sticky top-[52px] sm:top-[60px] z-30 -mx-2 px-4 sm:mx-0 sm:px-4 py-2 mb-3 bg-rouge-cinema border-2 border-bordeaux-profond sm:rounded-lg shadow-md font-bebas text-creme-ecran text-lg sm:text-xl uppercase tracking-wider flex items-center justify-between">
              <span>{formatDayLong(date)}</span>
              <span className="flex items-center gap-2">
                {date === today && (
                  <span className="bg-or-antique text-noir-velours text-[10px] px-2 py-0.5 rounded-full">
                    Aujourd&apos;hui
                  </span>
                )}
                <span className="font-crimson text-xs italic normal-case opacity-80">
                  {entries.length} film{entries.length > 1 ? 's' : ''}
                </span>
              </span>
            </h2>

            <div className="space-y-2">
              {entries.map(({ film, showtimes }) => (
                <button
                  key={`${date}-${film.id}`}
                  type="button"
                  onClick={() => onFilmClick(film)}
                  className="w-full text-left bg-creme-ecran border-2 border-sepia-chaud rounded-lg p-2 sm:p-3 flex gap-3 hover:border-rouge-cinema transition-colors"
                >
                  <img
                    src={film.posterUrl ?? NO_POSTER}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="w-12 h-[72px] sm:w-14 sm:h-[84px] object-cover rounded shadow flex-shrink-0 border border-sepia-chaud/50 bg-beige-papier"
                    onError={(e) => { e.currentTarget.src = NO_POSTER; }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <h3 className="font-playfair font-bold text-noir-velours text-sm sm:text-base leading-tight">
                        {film.title}
                      </h3>
                      <span className="font-crimson text-xs text-sepia-chaud italic">
                        {formatRuntime(film.runtime)}
                        {film.letterboxdRating != null && (
                          <span className="text-or-antique not-italic"> ★ {film.letterboxdRating.toFixed(1)}</span>
                        )}
                      </span>
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {showtimes.map((st) => (
                        <span
                          key={st.id}
                          className="font-bebas inline-flex items-baseline gap-1 bg-beige-papier border border-sepia-chaud/60 rounded px-1.5 py-0.5 text-[11px] text-noir-velours tracking-wide"
                        >
                          <span className="font-bold">{st.time}</span>
                          <span className="text-sepia-chaud text-[9px] uppercase">
                            {getCinemaShortName(st.cinemaName)}
                            {st.version && st.version !== 'VF' ? ` · ${st.version}` : ''}
                          </span>
                        </span>
                      ))}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
