import { useMemo, useState, useEffect, useCallback } from 'react';
import { WeekNavigator } from '../components/WeekNavigator';
import { DayStrip } from '../components/DayStrip';
import { FilmDrawer } from '../components/FilmDrawer';
import { ErrorState } from '../components/ErrorState';
import { FilmGridSkeleton } from '../components/Skeleton';
import { AddToSoireeButton } from '../components/soiree/AddToSoireeButton';
import { CandidateRow } from '../components/soiree/CandidateRow';
import { useFilms } from '../hooks/useFilms';
import { useWeekNavigation } from '../hooks/useWeekNavigation';
import { useCinemas } from '../hooks/useCinemas';
import { useFilmDrawer } from '../hooks/useFilmDrawer';
import { normalizeText } from '../hooks/useFilteredFilms';
import { useFiltersStore } from '../stores/filtersStore';
import { firstSelectableDate, formatWeekLabel, localISODate, nowHHMM, weekDatesFrom } from '../utils/dates';
import { getCinemaShortName } from '../utils/cinemaNames';
import { isOptInCity } from '../utils/cinemaFilter';
import {
  findChainable,
  toMinutes,
  estimatedEnd,
  formatClock,
  formatDuration,
  MAX_GAP_MIN,
  type ChainCandidate,
} from '../utils/chaining';
import type { FilmListItem, ShowtimeEntry } from '../types/components';

const NO_POSTER = '/images/no-poster.svg';

/** Référence stable : `?? []` en ligne recréerait un tableau à chaque rendu. */
const NO_FILMS: FilmListItem[] = [];

const START_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Toute la journée' },
  { value: '14:00', label: 'À partir de 14h' },
  { value: '17:00', label: 'À partir de 17h' },
  { value: '18:00', label: 'À partir de 18h' },
  { value: '19:00', label: 'À partir de 19h' },
  { value: '20:00', label: 'À partir de 20h' },
];

/** Battements proposés : de « juste le temps de sortir » à « on dîne entre les deux ». */
const GAP_OPTIONS = [30, MAX_GAP_MIN, 90, 120];

type CandidateSort = 'gap' | 'time' | 'rating';

const SORT_OPTIONS: { value: CandidateSort; label: string }[] = [
  // « Pertinence » et non « Battement » : findChainable remonte d'abord les
  // séances du même cinéma, le battement n'arbitre qu'à cinéma égal.
  { value: 'gap', label: 'Pertinence' },
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
  const { weekOffset, goToNextWeek, goToPrevWeek, goToToday } = useWeekNavigation();
  const { data, isLoading, isError, refetch } = useFilms(weekOffset);
  const weekFilms = data?.films ?? NO_FILMS;
  const weekDates = useMemo(
    () => (data?.meta.weekStart ? weekDatesFrom(data.meta.weekStart) : []),
    [data?.meta.weekStart],
  );
  const weekLabel = formatWeekLabel(data?.meta.weekStart, data?.meta.weekEnd);
  const { data: cinemas = [] } = useCinemas();
  const { isOpen, selectedFilm, openDrawer, closeDrawer } = useFilmDrawer();

  const today = localISODate();
  const now = nowHHMM();
  // La ville choisie sur l'affiche vaut aussi ici : arriver systématiquement sur
  // Brest alors qu'on parcourt Quimper depuis dix minutes est une friction gratuite.
  const filterCity = useFiltersStore((s) => s.selectedCity);
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [city, setCity] = useState(filterCity ?? 'Brest');
  const [minStart, setMinStart] = useState('17:00');
  const [maxGap, setMaxGap] = useState(MAX_GAP_MIN);
  const [search, setSearch] = useState('');
  const [filmId, setFilmId] = useState<string | null>(null);
  const [anchorId, setAnchorId] = useState<string | null>(null);
  const [sort, setSort] = useState<CandidateSort>('gap');

  const isToday = selectedDate === today;
  // Aujourd'hui, une séance déjà commencée n'est plus planifiable : le plancher
  // d'heure suit l'horloge, sinon la page propose encore la séance de 17h à 21h.
  const effectiveMinStart = isToday && now > minStart ? now : minStart;

  // Un jour est obligatoire ici : dès que la date choisie sort de la semaine
  // affichée, on se recale sur son premier jour sélectionnable et on repart
  // d'une feuille blanche, comme le fait le clic sur une puce de jour.
  useEffect(() => {
    if (weekDates.length === 0) return;
    if (weekDates.includes(selectedDate)) return;
    setSelectedDate(firstSelectableDate(weekDates, today));
    setFilmId(null);
    setAnchorId(null);
  }, [weekDates, today, selectedDate]);

  // Les villes hors zone (Troyes) restent masquées ici comme sur l'affiche, sauf
  // si c'est justement celle qu'on a choisie dans les filtres.
  const cities = useMemo(
    () =>
      [...new Set(cinemas.map((c) => c.city))]
        .filter((c) => !isOptInCity(c) || c === city)
        .sort(),
    [cinemas, city],
  );

  // Ville persistée devenue introuvable (cinéma retiré, filtre exotique) : on se
  // recale plutôt que de laisser un select sur une valeur absente de ses options.
  useEffect(() => {
    if (cities.length > 0 && !cities.includes(city)) setCity(cities[0]);
  }, [cities, city]);

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
            (!effectiveMinStart || st.time >= effectiveMinStart),
        )
        .sort((a, b) => a.time.localeCompare(b.time)),
    [selectedDate, city, effectiveMinStart, cityOf],
  );

  /** Étape 1 : films ayant au moins une séance éligible, tri Letterboxd, filtre recherche. */
  const pickableFilms = useMemo(() => {
    return weekFilms
      .map((film) => ({ film, count: eligibleShowtimes(film).length }))
      .filter(({ film, count }) => {
        if (count === 0) return false;
        if (search && !normalizeText(film.title).includes(normalizeText(search))) return false;
        return true;
      })
      // La note Letterboxd est celle affichée sur chaque ligne : trier dessus,
      // avec la popularité pour départager les films sans note.
      .sort((a, b) => {
        const byRating = (b.film.letterboxdRating ?? -1) - (a.film.letterboxdRating ?? -1);
        return byRating !== 0 ? byRating : (b.film.rating ?? 0) - (a.film.rating ?? 0);
      });
  }, [weekFilms, eligibleShowtimes, search]);

  const selectedFilmItem = useMemo(
    () => (filmId ? weekFilms.find((f) => f.id === filmId) ?? null : null),
    [filmId, weekFilms],
  );

  const anchorShowtimes = useMemo(() => {
    if (!selectedFilmItem) return [];
    const eligible = eligibleShowtimes(selectedFilmItem);
    // Une séance atteinte par ré-ancrage peut commencer avant le plancher
    // d'heure ; la garder dans les puces évite que le clic perde sa cible.
    if (anchorId && !eligible.some((st) => st.id === anchorId)) {
      const chosen = selectedFilmItem.showtimes.find((st) => st.id === anchorId);
      if (chosen) return [...eligible, chosen].sort((a, b) => a.time.localeCompare(b.time));
    }
    return eligible;
  }, [selectedFilmItem, eligibleShowtimes, anchorId]);

  const anchor =
    anchorShowtimes.find((st) => st.id === anchorId) ?? anchorShowtimes[0] ?? null;

  const notBefore = isToday ? now : undefined;

  const before = useMemo(() => {
    if (!selectedFilmItem || !anchor) return [];
    return sortCandidates(
      findChainable({ films: weekFilms, anchorFilm: selectedFilmItem, anchor, direction: 'before', cityOf, maxGapMin: maxGap, notBefore }),
      sort,
    );
  }, [weekFilms, selectedFilmItem, anchor, cityOf, sort, maxGap, notBefore]);

  const after = useMemo(() => {
    if (!selectedFilmItem || !anchor) return [];
    return sortCandidates(
      findChainable({ films: weekFilms, anchorFilm: selectedFilmItem, anchor, direction: 'after', cityOf, maxGapMin: maxGap, notBefore }),
      sort,
    );
  }, [weekFilms, selectedFilmItem, anchor, cityOf, sort, maxGap, notBefore]);

  /** Repart de la séance candidate : c'est ce qui rend les soirées à 3 films possibles. */
  const chainFrom = useCallback((candidate: ChainCandidate) => {
    setFilmId(candidate.film.id);
    setAnchorId(candidate.showtime.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

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
          <WeekNavigator
            weekOffset={weekOffset}
            weekLabel={weekLabel}
            onPrevWeek={goToPrevWeek}
            onNextWeek={goToNextWeek}
            onToday={goToToday}
          />

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

          {/* Le plancher effectif diffère alors de l'option affichée : le dire. */}
          {isToday && now > minStart && (
            <p className="font-crimson text-xs text-sepia-chaud italic">
              Séances déjà commencées masquées : aujourd'hui, on part de {now}.
            </p>
          )}
        </div>
      </div>

      {isLoading && <FilmGridSkeleton />}

      {isError && (
        <ErrorState
          message="Impossible de charger les films. Verifiez votre connexion."
          onRetry={() => refetch()}
        />
      )}

      {!isLoading && !isError && !selectedFilmItem && (
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
                {isToday && now > minStart
                  ? `Plus aucune séance après ${now} aujourd'hui. Essaie un autre jour ou une autre ville.`
                  : 'Aucun film ce jour-là avec ces critères. Essaie un autre jour, une autre ville ou une heure plus tôt.'}
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

      {!isLoading && !isError && selectedFilmItem && (
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

          {/* Tri et tolérance de battement */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mb-3">
            <div className="flex items-center gap-2">
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
            <div className="flex items-center gap-2">
              <label className="font-bebas text-xs text-sepia-chaud uppercase tracking-wide" htmlFor="candidate-gap">
                Battement max
              </label>
              <select
                id="candidate-gap"
                value={maxGap}
                onChange={(e) => setMaxGap(Number(e.target.value))}
                className={selectClass}
              >
                {GAP_OPTIONS.map((g) => (
                  <option key={g} value={g}>{formatDuration(g)}</option>
                ))}
              </select>
            </div>
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
                  onChain={() => chainFrom(c)}
                />
              ))}
            </div>
          ) : (
            <p className="font-crimson text-sm text-sepia-chaud italic mb-5">
              Aucune séance enchaînable après (battement max {formatDuration(maxGap)}, même ville).
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
                  onChain={() => chainFrom(c)}
                />
              ))}
            </div>
          ) : (
            <p className="font-crimson text-sm text-sepia-chaud italic">
              Aucune séance se terminant juste avant (même ville)
              {isToday ? ", séances déjà commencées exclues" : ''}.
            </p>
          )}

          <p className="font-crimson text-[11px] text-sepia-chaud/70 italic mt-4">
            Fins de séances estimées : durée du film + 15 min de publicités. Battement max {formatDuration(maxGap)},
            chevauchement toléré 10 min. Le bouton » enchaîne la recherche à partir d'une séance candidate.
          </p>
        </>
      )}

      <FilmDrawer
        film={selectedFilm}
        isOpen={isOpen}
        onClose={closeDrawer}
        films={weekFilms}
        cityOf={cityOf}
        onFilmSelect={openDrawer}
      />
    </div>
  );
}
