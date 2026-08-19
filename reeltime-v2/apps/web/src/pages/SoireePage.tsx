import { useMemo, useState, useEffect, useCallback } from 'react';
import { WeekNavigator } from '../components/WeekNavigator';
import { DayStrip } from '../components/DayStrip';
import { FilmDrawer } from '../components/FilmDrawer';
import { ErrorState } from '../components/ErrorState';
import { FilmGridSkeleton } from '../components/Skeleton';
import { SoireeFilters, SOIREE_SELECT_CLASS } from '../components/soiree/SoireeFilters';
import { SoireePlan } from '../components/soiree/SoireePlan';
import { CandidateList } from '../components/soiree/CandidateList';
import { FilmPicker, type PickableFilm } from '../components/soiree/FilmPicker';
import { useFilms } from '../hooks/useFilms';
import { useWeekNavigation } from '../hooks/useWeekNavigation';
import { useCinemas } from '../hooks/useCinemas';
import { useFilmDrawer } from '../hooks/useFilmDrawer';
import { useTravelMinutes } from '../hooks/useTravelMinutes';
import { normalizeText } from '../hooks/useFilteredFilms';
import { useFiltersStore } from '../stores/filtersStore';
import { useSoireeStore, addToSoiree, makeSoireeItem } from '../stores/soireeStore';
import { firstSelectableDate, formatWeekLabel, localISODate, nowHHMM, weekDatesFrom } from '../utils/dates';
import { isOptInCity } from '../utils/cinemaFilter';
import {
  CANDIDATE_SORT_OPTIONS,
  filterCandidates,
  matchesCinemas,
  matchesVersion,
  sortCandidates,
  type CandidateSort,
  type VersionFilter,
} from '../utils/soireeFilters';
import { findChainable, formatDuration, MAX_GAP_MIN } from '../utils/chaining';
import type { FilmListItem, ShowtimeEntry } from '../types/components';

/** Référence stable : `?? []` en ligne recréerait un tableau à chaque rendu. */
const NO_FILMS: FilmListItem[] = [];

/** Battements proposés : de « juste le temps de sortir » à « on dîne entre les deux ». */
const GAP_OPTIONS = [30, MAX_GAP_MIN, 90, 120];

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
  const travelOf = useTravelMinutes();

  const today = localISODate();
  const now = nowHHMM();

  const soirees = useSoireeStore((s) => s.soirees);
  const removeFromSoiree = useSoireeStore((s) => s.remove);
  const clearDate = useSoireeStore((s) => s.clearDate);

  // Une séance choisie depuis l'affiche arrive par l'URL : elle prime sur les
  // filtres, sinon on atterrirait sur un autre jour que celui qu'on vient de
  // cliquer. `?week=` est lu par useWeekNavigation.
  const seed = useMemo(() => new URLSearchParams(window.location.search), []);

  // Les filtres de l'affiche servent de point de départ, jamais de destination :
  // on les recopie au montage et on n'y réécrit rien.
  const [selectedDate, setSelectedDate] = useState<string>(
    () => seed.get('date') ?? today,
  );
  const [city, setCity] = useState(
    () => seed.get('city') ?? useFiltersStore.getState().selectedCity ?? 'Brest',
  );
  const [minStart, setMinStart] = useState('17:00');
  const [version, setVersion] = useState<VersionFilter>(() => {
    const persisted = useFiltersStore.getState().version;
    if (persisted == null) return 'all';
    // `VOST` et `VO` se rangent sous le même filtre, comme sur l'affiche.
    return persisted === 'VF' ? 'VF' : 'VO';
  });
  const [selectedCinemas, setSelectedCinemas] = useState<string[]>(
    () => useFiltersStore.getState().selectedCinemas,
  );
  const [sameCinemaOnly, setSameCinemaOnly] = useState(false);
  const [maxGap, setMaxGap] = useState(MAX_GAP_MIN);
  const [sort, setSort] = useState<CandidateSort>('chain');
  const [search, setSearch] = useState('');

  const isToday = selectedDate === today;
  // Aujourd'hui, une séance déjà commencée n'est plus planifiable : le plancher
  // d'heure suit l'horloge, sinon la page propose encore la séance de 17h à 21h.
  const effectiveMinStart = isToday && now > minStart ? now : minStart;

  // Dès que la date choisie sort de la semaine affichée, on se recale sur son
  // premier jour sélectionnable. Rien à réinitialiser : la soirée vit dans le
  // store, indexée par date.
  useEffect(() => {
    if (weekDates.length === 0) return;
    if (weekDates.includes(selectedDate)) return;
    setSelectedDate(firstSelectableDate(weekDates, today));
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

  const cityCinemas = useMemo(
    () => cinemas.filter((c) => c.city === city).sort((a, b) => a.name.localeCompare(b.name, 'fr')),
    [cinemas, city],
  );

  // Une sélection de salles héritée d'une autre ville produirait un filtre
  // invisible qui vide la page : mieux vaut alors ne rien filtrer.
  useEffect(() => {
    setSelectedCinemas((prev) => {
      const kept = prev.filter((id) => cityCinemas.some((c) => c.id === id));
      return kept.length === prev.length ? prev : kept;
    });
  }, [cityCinemas]);

  const toggleCinema = useCallback((cinemaId: string) => {
    setSelectedCinemas((prev) =>
      prev.includes(cinemaId) ? prev.filter((id) => id !== cinemaId) : [...prev, cinemaId],
    );
  }, []);

  const relaxFilters = useCallback(() => {
    setVersion('all');
    setSelectedCinemas([]);
    setSameCinemaOnly(false);
  }, []);

  const cityByCinemaId = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of cinemas) map.set(c.id, c.city);
    return map;
  }, [cinemas]);
  const cityOf = useCallback((cinemaId: string) => cityByCinemaId.get(cinemaId), [cityByCinemaId]);

  const items = useMemo(() => soirees[selectedDate] ?? [], [soirees, selectedDate]);
  const plannedShowtimeIds = useMemo(() => new Set(items.map((i) => i.showtimeId)), [items]);
  const plannedFilmIds = useMemo(() => new Set(items.map((i) => i.filmId)), [items]);

  /** Séances éligibles d'un film : jour, ville, heure, version et cinéma choisis. */
  const eligibleShowtimes = useCallback(
    (film: FilmListItem): ShowtimeEntry[] =>
      film.showtimes
        .filter(
          (st) =>
            st.datetime.slice(0, 10) === selectedDate &&
            cityByCinemaId.get(st.cinemaId) === city &&
            (!effectiveMinStart || st.time >= effectiveMinStart) &&
            matchesVersion(st.version, version) &&
            matchesCinemas(st.cinemaId, selectedCinemas),
        )
        .sort((a, b) => a.time.localeCompare(b.time)),
    [selectedDate, city, effectiveMinStart, cityByCinemaId, version, selectedCinemas],
  );

  const pickableFilms = useMemo<PickableFilm[]>(() => {
    return weekFilms
      .map((film) => ({ film, showtimes: eligibleShowtimes(film) }))
      .filter(({ film, showtimes }) => {
        if (showtimes.length === 0) return false;
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

  const notBefore = isToday ? now : undefined;

  /**
   * La soirée est l'ancre : « avant » part de son premier film, « après » de son
   * dernier. Deux exclusions s'ajoutent à celles de findChainable — les séances
   * déjà au plan, et tout film déjà au plan, qu'on ne veut pas revoir à une
   * autre heure.
   */
  const rawCandidates = useCallback(
    (direction: 'before' | 'after') => {
      if (items.length === 0 || !weekDates.includes(selectedDate)) return [];
      const anchorItem = direction === 'before' ? items[0] : items[items.length - 1];
      const anchor: ShowtimeEntry = {
        id: anchorItem.showtimeId,
        filmId: anchorItem.filmId,
        cinemaId: anchorItem.cinemaId,
        cinemaName: anchorItem.cinemaName,
        datetime: `${anchorItem.date}T${anchorItem.time}:00`,
        time: anchorItem.time,
        version: (anchorItem.version ?? 'VF') as ShowtimeEntry['version'],
        bookingUrl: anchorItem.bookingUrl,
      };
      return findChainable({
        films: weekFilms,
        anchorFilm: { id: anchorItem.filmId, runtime: anchorItem.runtime },
        anchor,
        direction,
        cityOf,
        maxGapMin: maxGap,
        notBefore,
        travelMinutesBetween: travelOf,
      }).filter((c) => !plannedShowtimeIds.has(c.showtime.id) && !plannedFilmIds.has(c.film.id));
    },
    [
      items,
      weekDates,
      selectedDate,
      weekFilms,
      cityOf,
      maxGap,
      notBefore,
      travelOf,
      plannedShowtimeIds,
      plannedFilmIds,
    ],
  );

  const beforeRaw = useMemo(() => rawCandidates('before'), [rawCandidates]);
  const afterRaw = useMemo(() => rawCandidates('after'), [rawCandidates]);

  const candidateFilters = useMemo(
    () => ({ version, cinemas: selectedCinemas, sameCinemaOnly }),
    [version, selectedCinemas, sameCinemaOnly],
  );

  const before = useMemo(
    () => sortCandidates(filterCandidates(beforeRaw, candidateFilters), sort),
    [beforeRaw, candidateFilters, sort],
  );
  const after = useMemo(
    () => sortCandidates(filterCandidates(afterRaw, candidateFilters), sort),
    [afterRaw, candidateFilters, sort],
  );

  const pick = useCallback(
    (film: FilmListItem, showtime: ShowtimeEntry) => {
      addToSoiree(makeSoireeItem(film, showtime, cityOf(showtime.cinemaId)));
    },
    [cityOf],
  );

  const hasPlan = items.length > 0;

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 max-w-4xl">
      <div className="bg-beige-papier border-2 border-sepia-chaud rounded-xl md:rounded-2xl p-3 sm:p-5 mb-4 shadow-md">
        <h1 className="font-bebas text-rouge-cinema text-2xl sm:text-3xl uppercase tracking-wider mb-1">
          🍿 Planifier ma soirée
        </h1>
        <p className="font-crimson text-sm text-sepia-chaud italic mb-4">
          Choisis une séance : elle rejoint ta soirée, et ce qui s'enchaîne avant et après apparaît
          aussitôt.
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
            onChange={(d) => setSelectedDate(d ?? today)}
            hideAllChip
          />

          <SoireeFilters
            cities={cities}
            city={city}
            onCityChange={setCity}
            minStart={minStart}
            onMinStartChange={setMinStart}
            version={version}
            onVersionChange={setVersion}
            cinemas={cityCinemas}
            selectedCinemas={selectedCinemas}
            onToggleCinema={toggleCinema}
            sameCinemaOnly={sameCinemaOnly}
            onSameCinemaOnlyChange={setSameCinemaOnly}
            showSameCinemaToggle={hasPlan}
          />

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

      {!isLoading && !isError && (
        <>
          <SoireePlan
            date={selectedDate}
            items={items}
            today={today}
            now={now}
            travelOf={travelOf}
            onRemove={(showtimeId) => removeFromSoiree(selectedDate, showtimeId)}
            onClear={() => clearDate(selectedDate)}
          />

          {hasPlan && (
            <>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mb-3">
                <div className="flex items-center gap-2">
                  <label
                    className="font-bebas text-xs text-sepia-chaud uppercase tracking-wide"
                    htmlFor="candidate-sort"
                  >
                    Tri
                  </label>
                  <select
                    id="candidate-sort"
                    value={sort}
                    onChange={(e) => setSort(e.target.value as CandidateSort)}
                    className={SOIREE_SELECT_CLASS}
                  >
                    {CANDIDATE_SORT_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <label
                    className="font-bebas text-xs text-sepia-chaud uppercase tracking-wide"
                    htmlFor="candidate-gap"
                  >
                    Battement max
                  </label>
                  <select
                    id="candidate-gap"
                    value={maxGap}
                    onChange={(e) => setMaxGap(Number(e.target.value))}
                    className={SOIREE_SELECT_CLASS}
                  >
                    {GAP_OPTIONS.map((g) => (
                      <option key={g} value={g}>{formatDuration(g)}</option>
                    ))}
                  </select>
                </div>
              </div>

              <CandidateList
                title="Après ta soirée"
                candidates={after}
                unfilteredCount={afterRaw.length}
                cityOf={cityOf}
                onOpenFilm={(c) => openDrawer(c.film)}
                maxGap={maxGap}
                emptyMessage="Aucune séance enchaînable après"
                onRelaxFilters={relaxFilters}
              />

              <CandidateList
                title="Avant ta soirée"
                candidates={before}
                unfilteredCount={beforeRaw.length}
                cityOf={cityOf}
                onOpenFilm={(c) => openDrawer(c.film)}
                maxGap={maxGap}
                emptyMessage={`Aucune séance se terminant juste avant${isToday ? ', séances déjà commencées exclues' : ''}`}
                onRelaxFilters={relaxFilters}
              />
            </>
          )}

          <FilmPicker
            entries={pickableFilms}
            search={search}
            onSearchChange={setSearch}
            plannedShowtimeIds={plannedShowtimeIds}
            onPick={pick}
            defaultOpen={!hasPlan}
            emptyMessage={
              isToday && now > minStart
                ? `Plus aucune séance après ${now} aujourd'hui. Essaie un autre jour, une autre ville ou des filtres plus larges.`
                : 'Aucun film ce jour-là avec ces critères. Essaie un autre jour, une autre ville, une heure plus tôt ou des filtres plus larges.'
            }
          />

          <p className="font-crimson text-[11px] text-sepia-chaud/70 italic mt-4">
            Fins de séances estimées : durée du film + 15 min de publicités. Battement max{' '}
            {formatDuration(maxGap)}, chevauchement toléré 10 min. Les trajets sont estimés à pied
            entre les salles et déduits du battement. « Meilleur enchaînement » remonte d'abord les
            séances du même cinéma, puis celles qui laissent le moins de temps mort.
          </p>
        </>
      )}

      <FilmDrawer
        film={selectedFilm}
        isOpen={isOpen}
        onClose={closeDrawer}
        cityOf={cityOf}
      />
    </div>
  );
}
