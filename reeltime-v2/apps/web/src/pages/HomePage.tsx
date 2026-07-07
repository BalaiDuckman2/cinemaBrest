import { useState, useEffect, useMemo, useCallback } from 'react';
import { WeekNavigator } from '../components/WeekNavigator';
import { FilmGrid } from '../components/FilmGrid';
import { FilmDrawer } from '../components/FilmDrawer';
import { FilmGridSkeleton } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { FilterBar } from '../components/filters';
import { DayStrip } from '../components/DayStrip';
import { PlanningView } from '../components/PlanningView';
import { useFilms } from '../hooks/useFilms';
import { useWeekNavigation } from '../hooks/useWeekNavigation';
import { useFilmDrawer } from '../hooks/useFilmDrawer';
import { useFilteredFilms } from '../hooks/useFilteredFilms';
import { useCinemas } from '../hooks/useCinemas';
import { useFiltersStore } from '../stores/filtersStore';
import { useSoireeStore } from '../stores/soireeStore';
import { weekDatesFrom, localISODate } from '../utils/dates';

function formatWeekLabel(weekStart?: string, weekEnd?: string): string {
  if (!weekStart || !weekEnd) return '';
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
  const start = new Date(weekStart + 'T00:00:00');
  const end = new Date(weekEnd + 'T00:00:00');
  const startStr = start.toLocaleDateString('fr-FR', opts);
  const endStr = end.toLocaleDateString('fr-FR', opts);
  return `${startStr} - ${endStr}`;
}

function ScrollToTopButton() {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const hasPlan = useSoireeStore((s) => s.items.length > 0);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        setShowScrollTop(window.scrollY > 300);
        ticking = false;
      });
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className={`fixed ${hasPlan ? 'bottom-20 md:bottom-24' : 'bottom-4 md:bottom-8'} right-4 md:right-8 bg-rouge-cinema hover:bg-bordeaux-profond text-creme-ecran p-3 md:p-4 rounded-full shadow-lg transition-opacity duration-300 z-50 border-2 border-or-antique ${
        showScrollTop ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      aria-label="Retour en haut"
    >
      <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
      </svg>
    </button>
  );
}

export function HomePage() {
  const { weekOffset, goToNextWeek, goToPrevWeek, goToToday } = useWeekNavigation();
  const { data, isLoading, isError, refetch, isPlaceholderData } = useFilms(weekOffset);
  const { isOpen, selectedFilm, openDrawer, closeDrawer } = useFilmDrawer();
  const { data: cinemas = [] } = useCinemas();
  const resetAll = useFiltersStore((s) => s.resetAll);
  const searchQuery = useFiltersStore((s) => s.searchQuery);
  const selectedDate = useFiltersStore((s) => s.selectedDate);
  const setSelectedDate = useFiltersStore((s) => s.setSelectedDate);
  const viewMode = useFiltersStore((s) => s.viewMode);
  const setViewMode = useFiltersStore((s) => s.setViewMode);
  const ceSoirMode = useFiltersStore((s) => s.ceSoirMode);
  const setCeSoirMode = useFiltersStore((s) => s.setCeSoirMode);
  const today = localISODate();

  // A specific day only makes sense within the week it was picked in.
  // "Ce soir" only turns off when leaving the current week: activating it from
  // another week sets weekOffset back to 0, which must NOT deactivate it.
  useEffect(() => {
    setSelectedDate(null);
    if (weekOffset !== 0) setCeSoirMode(false);
  }, [weekOffset, setSelectedDate, setCeSoirMode]);

  const { filteredFilms, activeFilterCount, hasActiveFilters } = useFilteredFilms(
    data?.films ?? [],
  );

  const weekDates = useMemo(
    () => (data?.meta.weekStart ? weekDatesFrom(data.meta.weekStart) : []),
    [data?.meta.weekStart],
  );

  const cityByCinemaId = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of cinemas) map.set(c.id, c.city);
    return map;
  }, [cinemas]);
  const cityOf = useCallback((cinemaId: string) => cityByCinemaId.get(cinemaId), [cityByCinemaId]);

  const weekLabel = formatWeekLabel(data?.meta.weekStart, data?.meta.weekEnd);
  const hasFilms = data && data.films.length > 0;
  const noResults = hasFilms && filteredFilms.length === 0;

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 max-w-7xl">
      {/* Scroll to top button */}
      <ScrollToTopButton />

      {/* Week navigation */}
      <WeekNavigator
        weekOffset={weekOffset}
        weekLabel={weekLabel}
        onPrevWeek={goToPrevWeek}
        onNextWeek={goToNextWeek}
        onToday={goToToday}
      />

      {/* Day strip + Ce soir + view mode toggle */}
      {!isLoading && !isError && hasFilms && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <DayStrip
              dates={weekDates}
              value={ceSoirMode ? today : selectedDate}
              onChange={(d) => {
                setCeSoirMode(false);
                setSelectedDate(d);
              }}
            />
          </div>
          <div className="flex shrink-0 items-center gap-2 self-start">
            <button
              type="button"
              onClick={() => {
                if (ceSoirMode) {
                  setCeSoirMode(false);
                } else {
                  goToToday();
                  setCeSoirMode(true);
                }
              }}
              aria-pressed={ceSoirMode}
              className={`font-bebas px-3 py-1.5 rounded-lg border-2 text-xs sm:text-sm uppercase tracking-wide transition-colors ${
                ceSoirMode
                  ? 'bg-rouge-cinema border-bordeaux-profond text-creme-ecran shadow-md'
                  : 'bg-creme-ecran border-sepia-chaud text-noir-velours hover:border-rouge-cinema'
              }`}
            >
              🌙 Ce soir
            </button>
            <div className="flex rounded-lg border-2 border-sepia-chaud overflow-hidden">
              {([
                ['grid', 'Affiche'],
                ['planning', 'Planning'],
              ] as const).map(([mode, label]) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setViewMode(mode)}
                  aria-pressed={viewMode === mode}
                  className={`font-bebas px-3 py-1.5 text-xs sm:text-sm uppercase tracking-wide transition-colors ${
                    viewMode === mode
                      ? 'bg-rouge-cinema text-creme-ecran'
                      : 'bg-creme-ecran text-noir-velours hover:bg-or-antique/20'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      {!isLoading && !isError && hasFilms && (
        <div className="-mx-2 px-2 sm:-mx-4 sm:px-4 pb-3">
          <FilterBar cinemas={cinemas} activeFilterCount={activeFilterCount} />
        </div>
      )}

      {/* Content area */}
      {isLoading && <FilmGridSkeleton />}

      {isError && (
        <ErrorState
          message="Impossible de charger les films. Verifiez votre connexion."
          onRetry={() => refetch()}
        />
      )}

      {!isLoading && !isError && data && data.films.length === 0 && (
        <EmptyState
          message="Aucun film trouve pour cette semaine"
          actionLabel="Voir la semaine suivante"
          onAction={goToNextWeek}
        />
      )}

      {!isLoading && !isError && noResults && hasActiveFilters && (
        <div className="text-center py-12 px-4">
          <p className="text-2xl text-sepia-chaud mb-2">🎬</p>
          <p className="font-crimson text-lg text-noir-velours font-semibold mb-1">
            {searchQuery
              ? `Aucun film trouvé pour '${searchQuery}'`
              : 'Aucun film trouvé'}
          </p>
          <p className="font-crimson text-sm text-sepia-chaud italic mb-4">
            Essayez de modifier vos filtres
          </p>

          <button
            type="button"
            onClick={resetAll}
            className="font-bebas rounded bg-rouge-cinema px-5 py-2 text-sm text-creme-ecran uppercase tracking-wide transition-colors hover:bg-bordeaux-profond"
          >
            Reinitialiser les filtres
          </button>
        </div>
      )}

      {!isLoading && !isError && noResults && !hasActiveFilters && selectedDate && (
        <EmptyState
          message="Aucune séance ce jour-là"
          actionLabel="Voir toute la semaine"
          onAction={() => setSelectedDate(null)}
        />
      )}

      {!isLoading && !isError && filteredFilms.length > 0 && (
        <div className={`transition-opacity duration-200 ${isPlaceholderData ? 'opacity-50 pointer-events-none' : ''}`}>
          {viewMode === 'planning' ? (
            <PlanningView films={filteredFilms} dates={weekDates} cityOf={cityOf} onFilmClick={openDrawer} />
          ) : (
            <FilmGrid films={filteredFilms} onFilmClick={openDrawer} />
          )}
        </div>
      )}

      {/* Film drawer */}
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
