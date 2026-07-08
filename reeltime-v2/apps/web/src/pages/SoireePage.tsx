import { useMemo, useState, useCallback } from 'react';
import { DayStrip } from '../components/DayStrip';
import { FilmDrawer } from '../components/FilmDrawer';
import { ErrorState } from '../components/ErrorState';
import { FilmGridSkeleton } from '../components/Skeleton';
import { AddToSoireeButton } from '../components/soiree/AddToSoireeButton';
import { CandidateRow } from '../components/soiree/CandidateRow';
import { useFilms } from '../hooks/useFilms';
import { useCinemas } from '../hooks/useCinemas';
import { useFilmDrawer } from '../hooks/useFilmDrawer';
import { normalizeText } from '../hooks/useFilteredFilms';
import { weekDatesFrom, localISODate } from '../utils/dates';
import { getCinemaShortName } from '../utils/cinemaNames';
import {
  findChainable,
  toMinutes,
  estimatedEnd,
  formatClock,
  type ChainCandidate,
} from '../utils/chaining';
import type { FilmListItem, ShowtimeEntry } from '../types/components';

const NO_POSTER = '/images/no-poster.svg';

const START_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Toute la journée' },
  { value: '14:00', label: 'À partir de 14h' },
  { value: '17:00', label: 'À partir de 17h' },
  { value: '18:00', label: 'À partir de 18h' },
  { value: '19:00', label: 'À partir de 19h' },
  { value: '20:00', label: 'À partir de 20h' },
];

type CandidateSort = 'gap' | 'time' | 'rating';

const SORT_OPTIONS: { value: CandidateSort; label: string }[] = [
  { value: 'gap', label: 'Battement' },
  { value: 'time', label: 'Heure de début' },
  { value: 'rating', label: 'Note Letterboxd' },
];

function sortCandidates(candidates: ChainCandidate[], sort: CandidateSort): ChainCandidate[] {
  if (sort === 'gap') return candidates; // ordre findChainable : même cinéma d'abord, puis battement
  const sorted = [...candidates];
  if (sort === 'time') {
    sorted.sort((a, b) => toMinutes(a.showtime.time) - toMinutes(b.showtime.time));
  } else {
    sorted.sort(
      (a, b) => (b.film.letterboxdRating ?? -1) - (a.film.letterboxdRating ?? -1),
    );
  }
  return sorted;
}

export function SoireePage() {
  const { data, isLoading, isError, refetch } = useFilms(0);
  const { data: cinemas = [] } = useCinemas();
  const { isOpen, selectedFilm, openDrawer, closeDrawer } = useFilmDrawer();

  const today = localISODate();
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [city, setCity] = useState('Brest');
  const [minStart, setMinStart] = useState('17:00');
  const [search, setSearch] = useState('');
  const [filmId, setFilmId] = useState<string | null>(null);
  const [anchorId, setAnchorId] = useState<string | null>(null);
  const [sort, setSort] = useState<CandidateSort>('gap');

  const weekDates = useMemo(
    () => (data?.meta.weekStart ? weekDatesFrom(data.meta.weekStart) : []),
    [data?.meta.weekStart],
  );

  const cities = useMemo(() => [...new Set(cinemas.map((c) => c.city))].sort(), [cinemas]);

  const cityByCinemaId = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of cinemas) map.set(c.id, c.city);
    return map;
  }, [cinemas]);
  const cityOf = useCallback((cinemaId: string) => cityByCinemaId.get(cinemaId), [cityByCinemaId]);

  /** Séances éligibles d'un film : jour + ville + heure de début choisis. */
  const eligibleShowtimes = useCallback(
    (film: FilmListItem): ShowtimeEntry[] =>
      film.showtimes
        .filter(
          (st) =>
            st.datetime.slice(0, 10) === selectedDate &&
            cityOf(st.cinemaId) === city &&
            (!minStart || st.time >= minStart),
        )
        .sort((a, b) => a.time.localeCompare(b.time)),
    [selectedDate, city, minStart, cityOf],
  );

  /** Étape 1 : films ayant au moins une séance éligible, tri popularité, filtre recherche. */
  const pickableFilms = useMemo(() => {
    if (!data) return [];
    return data.films
      .map((film) => ({ film, count: eligibleShowtimes(film).length }))
      .filter(({ film, count }) => {
        if (count === 0) return false;
        if (search && !normalizeText(film.title).includes(normalizeText(search))) return false;
        return true;
      })
      .sort((a, b) => (b.film.rating ?? 0) - (a.film.rating ?? 0));
  }, [data, eligibleShowtimes, search]);

  const selectedFilmItem = useMemo(
    () => (filmId && data ? data.films.find((f) => f.id === filmId) ?? null : null),
    [filmId, data],
  );

  const anchorShowtimes = selectedFilmItem ? eligibleShowtimes(selectedFilmItem) : [];
  const anchor =
    anchorShowtimes.find((st) => st.id === anchorId) ?? anchorShowtimes[0] ?? null;

  const before = useMemo(() => {
    if (!data || !selectedFilmItem || !anchor) return [];
    return sortCandidates(
      findChainable({ films: data.films, anchorFilm: selectedFilmItem, anchor, direction: 'before', cityOf }),
      sort,
    );
  }, [data, selectedFilmItem, anchor, cityOf, sort]);

  const after = useMemo(() => {
    if (!data || !selectedFilmItem || !anchor) return [];
    return sortCandidates(
      findChainable({ films: data.films, anchorFilm: selectedFilmItem, anchor, direction: 'after', cityOf }),
      sort,
    );
  }, [data, selectedFilmItem, anchor, cityOf, sort]);

  const selectClass =
    'font-crimson px-2 py-2 bg-creme-ecran border-2 border-sepia-chaud rounded-lg text-noir-velours text-xs focus:outline-none focus:border-rouge-cinema focus:ring-2 focus:ring-rouge-cinema/20';

  const endStr = anchor && selectedFilmItem
    ? `${selectedFilmItem.runtime == null ? '~' : ''}${formatClock(estimatedEnd(toMinutes(anchor.time), selectedFilmItem.runtime))}`
    : '';

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 max-w-4xl">
      <div className="bg-beige-papier border-2 border-sepia-chaud rounded-xl md:rounded-2xl p-3 sm:p-5 mb-4 shadow-md">
        <h1 className="font-bebas text-rouge-cinema text-2xl sm:text-3xl uppercase tracking-wider mb-1">
          🍿 Planifier ma soirée
        </h1>
        <p className="font-crimson text-sm text-sepia-chaud italic mb-4">
          Choisis ton film, puis construis ta soirée autour : ce qui s'enchaîne avant et après.
        </p>

        <div className="space-y-3">
          <DayStrip
            dates={weekDates}
            value={selectedDate}
            onChange={(d) => {
              setSelectedDate(d ?? today);
              setFilmId(null);
              setAnchorId(null);
            }}
            hideAllChip
          />

          <div className="grid grid-cols-2 gap-2 sm:gap-3 max-w-md">
            <select
              value={city}
              onChange={(e) => {
                setCity(e.target.value);
                setFilmId(null);
                setAnchorId(null);
              }}
              className={selectClass}
              aria-label="Ville"
            >
              {cities.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <select
              value={minStart}
              onChange={(e) => {
                setMinStart(e.target.value);
                setAnchorId(null);
              }}
              className={selectClass}
              aria-label="Heure de début"
            >
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

      {!isLoading && !isError && data && !selectedFilmItem && (
        <>
          {/* Étape 1 : choisir le film */}
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un film..."
            aria-label="Rechercher un film"
            className="font-crimson w-full px-3 py-2 mb-3 bg-creme-ecran border-2 border-sepia-chaud rounded-lg text-noir-velours text-sm placeholder-sepia-chaud/60 focus:outline-none focus:ring-2 focus:ring-rouge-cinema focus:border-rouge-cinema shadow-sm"
          />

          {pickableFilms.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-2xl mb-2">🎬</p>
              <p className="font-crimson text-noir-velours">
                Aucun film ce jour-là avec ces critères. Essaie un autre jour, une autre ville ou une heure plus tôt.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {pickableFilms.map(({ film, count }) => (
                <button
                  key={film.id}
                  type="button"
                  onClick={() => {
                    setFilmId(film.id);
                    setAnchorId(null);
                  }}
                  className="w-full text-left bg-creme-ecran border-2 border-sepia-chaud rounded-lg p-2 flex gap-3 items-center hover:border-rouge-cinema transition-colors"
                >
                  <img
                    src={film.posterUrl ?? NO_POSTER}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="w-10 h-[60px] object-cover rounded shadow flex-shrink-0 border border-sepia-chaud/50 bg-beige-papier"
                    onError={(e) => { e.currentTarget.src = NO_POSTER; }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-playfair font-bold text-noir-velours text-sm leading-tight truncate">
                      {film.title}
                    </p>
                    <p className="font-bebas text-xs text-sepia-chaud tracking-wide">
                      {film.letterboxdRating != null && (
                        <span className="text-or-antique">★ {film.letterboxdRating.toFixed(1)} · </span>
                      )}
                      {count} séance{count > 1 ? 's' : ''}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {!isLoading && !isError && data && selectedFilmItem && (
        <>
          {/* Étape 2 : construire autour du film */}
          <button
            type="button"
            onClick={() => {
              setFilmId(null);
              setAnchorId(null);
            }}
            className="font-bebas mb-3 flex items-center gap-1.5 text-sm text-rouge-cinema uppercase tracking-wide hover:text-bordeaux-profond transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Changer de film
          </button>

          <div className="flex gap-3 items-center mb-3">
            <img
              src={selectedFilmItem.posterUrl ?? NO_POSTER}
              alt=""
              className="w-12 h-[72px] object-cover rounded shadow flex-shrink-0 border border-sepia-chaud/50 bg-beige-papier"
              onError={(e) => { e.currentTarget.src = NO_POSTER; }}
            />
            <div className="min-w-0">
              <h2 className="font-playfair font-bold text-noir-velours text-lg leading-tight">
                {selectedFilmItem.title}
              </h2>
              {anchor && (
                <p className="font-crimson text-sm text-sepia-chaud italic">
                  {anchor.time} ({getCinemaShortName(anchor.cinemaName)}), fin estimée {endStr}
                </p>
              )}
            </div>
          </div>

          {/* Chips de séances (ancre) */}
          <div className="flex flex-wrap gap-1.5 mb-3" role="group" aria-label="Choisir une séance">
            {anchorShowtimes.map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setAnchorId(st.id)}
                aria-pressed={anchor?.id === st.id}
                className={`font-bebas px-3 py-1.5 rounded-full border-2 text-xs uppercase tracking-wide transition-colors ${
                  anchor?.id === st.id
                    ? 'bg-rouge-cinema border-bordeaux-profond text-creme-ecran shadow-md'
                    : 'bg-creme-ecran border-sepia-chaud text-noir-velours hover:border-rouge-cinema'
                }`}
              >
                {st.time} · {getCinemaShortName(st.cinemaName)}
                {st.version && st.version !== 'VF' ? ` · ${st.version}` : ''}
              </button>
            ))}
          </div>

          {anchor && (
            <AddToSoireeButton
              film={selectedFilmItem}
              showtime={anchor}
              city={cityOf(anchor.cinemaId)}
              label="Ajouter cette séance"
              className="px-3 py-1.5 mb-4 font-bebas text-xs uppercase tracking-wide"
            />
          )}

          {/* Tri des candidats */}
          <div className="flex items-center gap-2 mb-3">
            <label className="font-bebas text-xs text-sepia-chaud uppercase tracking-wide" htmlFor="candidate-sort">
              Tri
            </label>
            <select
              id="candidate-sort"
              value={sort}
              onChange={(e) => setSort(e.target.value as CandidateSort)}
              className={selectClass}
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <h3 className="font-bebas text-noir-velours text-base uppercase tracking-wider mb-2 flex items-center gap-2">
            <span className="w-1 h-4 bg-rouge-cinema rounded-full" />
            Après cette séance
          </h3>
          {after.length > 0 ? (
            <div className="space-y-2 mb-5">
              {after.map((c) => (
                <CandidateRow
                  key={c.showtime.id}
                  candidate={c}
                  city={cityOf(c.showtime.cinemaId)}
                  onClick={() => openDrawer(c.film)}
                />
              ))}
            </div>
          ) : (
            <p className="font-crimson text-sm text-sepia-chaud italic mb-5">
              Aucune séance enchaînable après (battement max 1h, même ville).
            </p>
          )}

          <h3 className="font-bebas text-noir-velours text-base uppercase tracking-wider mb-2 flex items-center gap-2">
            <span className="w-1 h-4 bg-rouge-cinema rounded-full" />
            Avant cette séance
          </h3>
          {before.length > 0 ? (
            <div className="space-y-2">
              {before.map((c) => (
                <CandidateRow
                  key={c.showtime.id}
                  candidate={c}
                  city={cityOf(c.showtime.cinemaId)}
                  onClick={() => openDrawer(c.film)}
                />
              ))}
            </div>
          ) : (
            <p className="font-crimson text-sm text-sepia-chaud italic">
              Aucune séance se terminant juste avant (même ville).
            </p>
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
