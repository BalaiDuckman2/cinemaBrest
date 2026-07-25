import { useState } from 'react';
import type { FilmListItem, ShowtimeEntry } from '../types/components';
import { getCinemaShortName } from '../utils/cinemaNames';
import { useFiltersStore } from '../stores/filtersStore';
import { ShowtimeRow } from './ShowtimeRow';

const DAYS_FR = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];
const MONTHS_FR = [
  'janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin',
  'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.',
];

function extractDate(datetime: string): string {
  return datetime.slice(0, 10);
}

interface ParsedDate {
  dayName: string;
  dayNumber: number;
  monthName: string;
}

function parseDateFr(dateStr: string): ParsedDate {
  const date = new Date(dateStr + 'T00:00:00');
  return {
    dayName: DAYS_FR[date.getDay()],
    dayNumber: date.getDate(),
    monthName: MONTHS_FR[date.getMonth()],
  };
}

type GroupedByDateCinema = Record<string, Record<string, ShowtimeEntry[]>>;

function groupShowtimes(showtimes: ShowtimeEntry[]): GroupedByDateCinema {
  const byDate: GroupedByDateCinema = {};

  for (const st of showtimes) {
    const date = extractDate(st.datetime);
    if (!byDate[date]) byDate[date] = {};
    if (!byDate[date][st.cinemaName]) byDate[date][st.cinemaName] = [];
    byDate[date][st.cinemaName].push(st);
  }

  for (const date of Object.keys(byDate)) {
    for (const cinema of Object.keys(byDate[date])) {
      byDate[date][cinema].sort((a, b) => a.time.localeCompare(b.time));
    }
  }

  return byDate;
}

interface FilmShowtimesProps {
  showtimes: ShowtimeEntry[];
  /** Le film parent (snapshot pour « Ma soirée »). */
  film: Pick<FilmListItem, 'id' | 'title' | 'posterUrl' | 'runtime'>;
  /** When provided, each showtime gets a "chain with another film" button. */
  onChain?: (st: ShowtimeEntry) => void;
  /** When provided, each showtime gets a "+ Ma soirée" button. */
  cityOf?: (cinemaId: string) => string | undefined;
}

export function FilmShowtimes({ showtimes, film, onChain, cityOf }: FilmShowtimesProps) {
  const grouped = groupShowtimes(showtimes);
  const sortedDates = Object.keys(grouped).sort();
  const selectedDate = useFiltersStore((s) => s.selectedDate);

  // Le drawer s'ouvre sur le jour choisi dans la bande de dates, et non
  // systématiquement sur le premier jour programmé.
  const [openDate, setOpenDate] = useState<string | null>(
    selectedDate && sortedDates.includes(selectedDate) ? selectedDate : sortedDates[0] ?? null,
  );

  if (showtimes.length === 0) {
    return (
      <div className="mb-8">
        <h4 className="font-bebas text-rouge-cinema text-2xl uppercase tracking-wider mb-4 flex items-center gap-2">
          <span>🎬</span> Programme de la Semaine
        </h4>
        <p className="font-crimson text-sepia-chaud text-sm italic">
          Aucune séance disponible cette semaine
        </p>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <h4 className="font-bebas text-rouge-cinema text-2xl uppercase tracking-wider mb-4 flex items-center gap-2">
        <span>🎬</span> Programme de la Semaine
      </h4>

      <div className="space-y-2">
        {sortedDates.map((date) => {
          const { dayName, dayNumber, monthName } = parseDateFr(date);
          const cinemas = grouped[date];
          const count = Object.values(cinemas).reduce((n, times) => n + times.length, 0);
          const isOpen = openDate === date;

          return (
            <section
              key={date}
              className="bg-beige-papier rounded-lg border-2 border-sepia-chaud shadow-sm overflow-hidden"
            >
              <button
                type="button"
                onClick={() => setOpenDate((d) => (d === date ? null : date))}
                aria-expanded={isOpen}
                style={{ background: 'linear-gradient(135deg, #D32F2F 0%, #B71C1C 100%)' }}
                className="w-full min-h-[44px] p-3 flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="text-creme-ecran flex flex-col items-center min-w-[50px]">
                    <span className="font-bebas text-xs uppercase tracking-wider opacity-90">
                      {dayName}
                    </span>
                    <span className="font-playfair text-3xl font-bold leading-none">
                      {dayNumber}
                    </span>
                    <span className="font-crimson text-xs italic opacity-80">{monthName}</span>
                  </div>
                  <div className="font-bebas text-creme-ecran text-sm uppercase tracking-wide">
                    {count} séance{count > 1 ? 's' : ''}
                  </div>
                </div>
                <svg
                  className={`w-5 h-5 text-jaune-marquise transform transition-transform ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isOpen && (
                <div className="px-3 bg-creme-ecran">
                  {Object.entries(cinemas).map(([cinemaName, times]) => (
                    <div key={cinemaName} className="py-2">
                      <h5 className="font-bebas text-rouge-cinema text-sm uppercase tracking-wider mb-1 flex items-center gap-2">
                        <span className="w-1 h-4 bg-rouge-cinema rounded-full" />
                        {getCinemaShortName(cinemaName)}
                      </h5>
                      {times.map((st) => (
                        <ShowtimeRow
                          key={st.id}
                          showtime={st}
                          film={film}
                          city={cityOf?.(st.cinemaId)}
                          onChain={onChain}
                          showCinema={false}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
