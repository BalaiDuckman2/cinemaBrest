import { Link } from 'react-router-dom';
import type { ShowtimeEntry } from '../types/components';

const DAYS_FR = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];
const MONTHS_FR = [
  'janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin',
  'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.',
];

const CINEMA_SHORT_NAMES: Record<string, string> = {
  'Les Studios': 'Studios',
  'CGR Brest Le Celtic': 'CGR',
  'Multiplexe Liberté': 'Liberté',
  'Pathé Capucins': 'Pathé',
  'Ciné Galaxy': 'Galaxy',
  'Les Baladins': 'Baladins',
};

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

interface FilmShowtimesFilm {
  title: string;
  year: number;
  posterUrl: string | null;
  runtime: number | null;
  director: string | null;
  genres: string[];
}

interface FilmShowtimesProps {
  showtimes: ShowtimeEntry[];
  film: FilmShowtimesFilm;
}

export function FilmShowtimes({ showtimes, film }: FilmShowtimesProps) {
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

  const grouped = groupShowtimes(showtimes);
  const sortedDates = Object.keys(grouped).sort();

  return (
    <div className="mb-8">
      <h4 className="font-bebas text-rouge-cinema text-2xl uppercase tracking-wider mb-4 flex items-center gap-2">
        <span>🎬</span> Programme de la Semaine
      </h4>

      <div className="space-y-2">
        {sortedDates.map((date, idx) => {
          const { dayName, dayNumber, monthName } = parseDateFr(date);
          const cinemas = grouped[date];

          return (
            <details
              key={date}
              className="group bg-beige-papier rounded-lg border-2 border-sepia-chaud shadow-sm overflow-hidden"
              open={idx === 0}
            >
              <summary
                style={{ background: 'linear-gradient(135deg, #D32F2F 0%, #B71C1C 100%)' }}
                className="p-3 cursor-pointer flex items-center justify-between list-none [&::-webkit-details-marker]:hidden"
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
                    Séances du jour
                  </div>
                </div>
                <svg
                  className="w-5 h-5 text-jaune-marquise transform transition-transform group-open:rotate-180"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>

              <div className="p-4 space-y-4 bg-creme-ecran">
                {Object.entries(cinemas).map(([cinemaName, times]) => {
                  const shortName = CINEMA_SHORT_NAMES[cinemaName] ?? cinemaName;

                  return (
                    <div
                      key={cinemaName}
                      className="border-b border-sepia-chaud/30 last:border-0 pb-3 last:pb-0"
                    >
                      <h5 className="font-bebas text-rouge-cinema text-sm uppercase tracking-wider mb-2 flex items-center gap-2">
                        <span className="w-1 h-4 bg-rouge-cinema rounded-full" />
                        {shortName}
                      </h5>
                      <div className="flex flex-wrap gap-2">
                        {times.map((st) => (
                          <Link
                            key={st.id}
                            to={`/reservation/${st.id}`}
                            state={{
                              film: {
                                title: film.title,
                                year: film.year,
                                posterUrl: film.posterUrl,
                                runtime: film.runtime,
                                director: film.director,
                                genres: film.genres,
                              },
                              showtime: st,
                            }}
                            style={{
                              position: 'relative',
                              background: 'linear-gradient(135deg, #D32F2F 0%, #C62828 100%)',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                            }}
                            className="font-bebas text-creme-ecran border-or-antique px-3 py-2 rounded-md text-xs uppercase tracking-wider border-2 hover:border-jaune-marquise transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer"
                          >
                            <span className="font-bold text-sm block leading-none">
                              {st.time}
                            </span>
                            {st.version && (
                              <span className="text-[9px] opacity-90 block mt-0.5 leading-none">
                                {st.version}
                              </span>
                            )}
                            <div
                              style={{
                                position: 'absolute',
                                top: '-2px',
                                right: '-2px',
                                width: '8px',
                                height: '8px',
                                background: '#FFF8E1',
                                borderBottomLeftRadius: '8px',
                              }}
                            />
                          </Link>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </details>
          );
        })}
      </div>
    </div>
  );
}
