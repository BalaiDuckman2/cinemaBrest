import { useMemo, useState, useCallback } from 'react';
import { DayStrip } from '../components/DayStrip';
import { FilmDrawer } from '../components/FilmDrawer';
import { ErrorState } from '../components/ErrorState';
import { FilmGridSkeleton } from '../components/Skeleton';
import { useFilms } from '../hooks/useFilms';
import { useCinemas } from '../hooks/useCinemas';
import { useFilmDrawer } from '../hooks/useFilmDrawer';
import { addToSoiree, makeSoireeItem } from '../stores/soireeStore';
import { weekDatesFrom, localISODate, formatDayLong } from '../utils/dates';
import { getCinemaShortName } from '../utils/cinemaNames';
import {
  buildEveningCombos,
  toMinutes,
  estimatedEnd,
  formatClock,
  formatGap,
  type EveningCombo,
} from '../utils/chaining';
import type { FilmListItem, ShowtimeEntry } from '../types/components';

const NO_POSTER = '/images/no-poster.svg';
const MAX_COMBOS = 80;

const START_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Toute la journée' },
  { value: '14:00', label: 'À partir de 14h' },
  { value: '17:00', label: 'À partir de 17h' },
  { value: '18:00', label: 'À partir de 18h' },
  { value: '19:00', label: 'À partir de 19h' },
  { value: '20:00', label: 'À partir de 20h' },
];

function ComboFilmRow({ film, showtime, end }: { film: FilmListItem; showtime: ShowtimeEntry; end?: string }) {
  return (
    <div className="flex items-center gap-2.5 min-w-0">
      <img
        src={film.posterUrl ?? NO_POSTER}
        alt=""
        loading="lazy"
        decoding="async"
        className="w-9 h-[54px] object-cover rounded shadow flex-shrink-0 border border-sepia-chaud/50 bg-beige-papier"
        onError={(e) => { e.currentTarget.src = NO_POSTER; }}
      />
      <div className="min-w-0">
        <p className="font-playfair font-bold text-noir-velours text-sm leading-tight truncate">
          {film.title}
        </p>
        <p className="font-bebas text-xs text-noir-velours tracking-wide">
          {showtime.time}
          {end ? <span className="text-sepia-chaud"> → {end}</span> : null}
          <span className="text-sepia-chaud"> · {getCinemaShortName(showtime.cinemaName)}</span>
          {showtime.version && showtime.version !== 'VF' && (
            <span className="text-sepia-chaud"> · {showtime.version}</span>
          )}
        </p>
      </div>
    </div>
  );
}

export function SoireePage() {
  const { data, isLoading, isError, refetch } = useFilms(0);
  const { data: cinemas = [] } = useCinemas();
  const { isOpen, selectedFilm, openDrawer, closeDrawer } = useFilmDrawer();

  const today = localISODate();
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [city, setCity] = useState('Brest');
  const [minStart, setMinStart] = useState('17:00');

  const weekDates = useMemo(
    () => (data?.meta.weekStart ? weekDatesFrom(data.meta.weekStart) : []),
    [data?.meta.weekStart],
  );

  const cities = useMemo(
    () => [...new Set(cinemas.map((c) => c.city))].sort(),
    [cinemas],
  );

  const cityByCinemaId = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of cinemas) map.set(c.id, c.city);
    return map;
  }, [cinemas]);
  const cityOf = useCallback((cinemaId: string) => cityByCinemaId.get(cinemaId), [cityByCinemaId]);

  const combos = useMemo(() => {
    if (!data) return [];
    return buildEveningCombos({
      films: data.films,
      date: selectedDate,
      city,
      cityOf,
      minStartMin: minStart ? toMinutes(minStart) : null,
    });
  }, [data, selectedDate, city, cityOf, minStart]);

  const shownCombos = combos.slice(0, MAX_COMBOS);

  const selectClass = 'font-crimson px-2 py-2 bg-creme-ecran border-2 border-sepia-chaud rounded-lg text-noir-velours text-xs focus:outline-none focus:border-rouge-cinema focus:ring-2 focus:ring-rouge-cinema/20';

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 max-w-4xl">
      <div className="bg-beige-papier border-2 border-sepia-chaud rounded-xl md:rounded-2xl p-3 sm:p-5 mb-4 shadow-md">
        <h1 className="font-bebas text-rouge-cinema text-2xl sm:text-3xl uppercase tracking-wider mb-1">
          🍿 Planifier ma soirée
        </h1>
        <p className="font-crimson text-sm text-sepia-chaud italic mb-4">
          Deux films à la suite : choisis un jour, une ville, et voilà les enchaînements possibles.
        </p>

        <div className="space-y-3">
          <DayStrip dates={weekDates} value={selectedDate} onChange={(d) => setSelectedDate(d ?? today)} hideAllChip />

          <div className="grid grid-cols-2 gap-2 sm:gap-3 max-w-md">
            <select value={city} onChange={(e) => setCity(e.target.value)} className={selectClass} aria-label="Ville">
              {cities.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <select value={minStart} onChange={(e) => setMinStart(e.target.value)} className={selectClass} aria-label="Heure de début">
              {START_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {isLoading && <FilmGridSkeleton />}

      {isError && (
        <ErrorState
          message="Impossible de charger les films. Verifiez votre connexion."
          onRetry={() => refetch()}
        />
      )}

      {!isLoading && !isError && data && (
        <>
          <p className="font-crimson text-sm text-sepia-chaud italic mb-3">
            {formatDayLong(selectedDate)} à {city} —{' '}
            {combos.length === 0
              ? 'aucun enchaînement trouvé'
              : `${combos.length} enchaînement${combos.length > 1 ? 's' : ''} possible${combos.length > 1 ? 's' : ''}${combos.length > MAX_COMBOS ? ` (${MAX_COMBOS} affichés)` : ''}`}
          </p>

          {combos.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-2xl mb-2">🎬</p>
              <p className="font-crimson text-noir-velours">
                Essaie un autre jour, une autre ville ou une heure de début plus tôt.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {shownCombos.map((combo: EveningCombo, idx) => {
                const firstStart = toMinutes(combo.first.showtime.time);
                const firstEnd = estimatedEnd(firstStart, combo.first.film.runtime);
                const endLabel = `${combo.first.film.runtime == null ? '~' : ''}${formatClock(firstEnd)}`;
                return (
                  <div
                    key={`${combo.first.showtime.id}-${combo.second.showtime.id}-${idx}`}
                    className="bg-creme-ecran border-2 border-sepia-chaud rounded-lg p-3 shadow-sm"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-2 sm:gap-3 items-center">
                      <button type="button" onClick={() => openDrawer(combo.first.film)} className="text-left min-w-0">
                        <ComboFilmRow film={combo.first.film} showtime={combo.first.showtime} end={endLabel} />
                      </button>
                      <div className="font-bebas text-center text-xs text-sepia-chaud uppercase tracking-wide flex sm:flex-col items-center gap-1.5 sm:gap-0.5 justify-center">
                        <svg className="w-4 h-4 rotate-90 sm:rotate-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                        <span className={combo.gapMin < 0 ? 'text-rouge-cinema' : ''}>
                          {formatGap(combo.gapMin)}
                        </span>
                        {combo.sameCinema && <span className="text-or-antique">même ciné</span>}
                      </div>
                      <button type="button" onClick={() => openDrawer(combo.second.film)} className="text-left min-w-0">
                        <ComboFilmRow film={combo.second.film} showtime={combo.second.showtime} />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        [
                          makeSoireeItem(combo.first.film, combo.first.showtime, cityOf(combo.first.showtime.cinemaId)),
                          makeSoireeItem(combo.second.film, combo.second.showtime, cityOf(combo.second.showtime.cinemaId)),
                        ].forEach(addToSoiree)
                      }
                      className="font-bebas mt-2 w-full sm:w-auto px-3 py-1.5 rounded-md border-2 border-sepia-chaud bg-beige-papier text-noir-velours text-xs uppercase tracking-wide hover:border-rouge-cinema hover:text-rouge-cinema transition-colors"
                    >
                      🎟 Utiliser ce combo
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <p className="font-crimson text-[11px] text-sepia-chaud/70 italic mt-4">
            Fins de séances estimées : durée du film + 15 min de publicités. Battement max 1h, chevauchement toléré 10 min.
          </p>
        </>
      )}

      <FilmDrawer
        film={selectedFilm}
        isOpen={isOpen}
        onClose={closeDrawer}
        films={data?.films}
        cityOf={cityOf}
        onFilmSelect={openDrawer}
      />
    </div>
  );
}
