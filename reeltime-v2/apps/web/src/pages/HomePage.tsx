import { useState, useEffect, useMemo, useCallback } from 'react';
import { FilmGrid } from '../components/FilmGrid';
import { FilmDrawer } from '../components/FilmDrawer';
import { FilmGridSkeleton } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { FilterBar, FilterSheet, ActiveFilterTags } from '../components/filters';
import { DateStrip } from '../components/DateStrip';
import { PlanningView } from '../components/PlanningView';
import { useFilmsRange } from '../hooks/useFilmsRange';
import { useSelectedDate } from '../hooks/useSelectedDate';
import { useFilmDrawer } from '../hooks/useFilmDrawer';
import { useFilteredFilms } from '../hooks/useFilteredFilms';
import { useCinemas } from '../hooks/useCinemas';
import { useFiltersStore } from '../stores/filtersStore';
import { localISODate } from '../utils/dates';

function ScrollToTopButton() {
  const [showScrollTop, setShowScrollTop] = useState(false);

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
      className={`fixed bottom-[calc(64px+env(safe-area-inset-bottom))] md:bottom-8 right-4 md:right-8 bg-rouge-cinema hover:bg-bordeaux-profond text-creme-ecran p-3 md:p-4 rounded-full shadow-lg transition-opacity duration-300 z-30 border-2 border-or-antique ${
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
  const { selectedDate, setSelectedDate } = useSelectedDate();
  const {
    films: rangeFilms,
    dates: weekDates,
    isLoading,
    isLoadingMore,
    isError,
    refetch,
    loadMore,
  } = useFilmsRange(selectedDate);
  const { isOpen, selectedFilm, openDrawer, closeDrawer } = useFilmDrawer();
  const { data: cinemas = [] } = useCinemas();
  const resetAll = useFiltersStore((s) => s.resetAll);
  const searchQuery = useFiltersStore((s) => s.searchQuery);
  const viewMode = useFiltersStore((s) => s.viewMode);
  const setViewMode = useFiltersStore((s) => s.setViewMode);
  const ceSoirMode = useFiltersStore((s) => s.ceSoirMode);
  const setCeSoirMode = useFiltersStore((s) => s.setCeSoirMode);
  const setSearchQuery = useFiltersStore((s) => s.setSearchQuery);
  const today = localISODate();

  const [searchOpen, setSearchOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // La recherche reste dépliée tant que la requête est non vide.
  useEffect(() => {
    if (searchQuery) setSearchOpen(true);
  }, [searchQuery]);

  const { filteredFilms, activeFilterCount, hasActiveFilters } = useFilteredFilms(rangeFilms);

  const cityByCinemaId = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of cinemas) map.set(c.id, c.city);
    return map;
  }, [cinemas]);
  const cityOf = useCallback((cinemaId: string) => cityByCinemaId.get(cinemaId), [cityByCinemaId]);

  const hasFilms = rangeFilms.length > 0;
  const noResults = hasFilms && filteredFilms.length === 0;

  return (
    <div className="page-sticky-root container mx-auto px-2 sm:px-4 py-4 sm:py-8 max-w-7xl">
      {/* Scroll to top button */}
      <ScrollToTopButton />

      {/* Barre collée : bande de dates + commandes. Seul élément épinglé sur mobile. */}
      {!isLoading && !isError && hasFilms && (
        <div className="sticky top-0 z-30 -mx-2 sm:-mx-4 px-2 sm:px-4 py-2 mb-3 bg-beige-papier/95 backdrop-blur border-b-2 border-sepia-chaud md:static md:bg-transparent md:backdrop-blur-none md:border-0 md:mb-3">
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <DateStrip
                dates={weekDates}
                value={ceSoirMode ? today : selectedDate}
                onChange={(d) => {
                  setCeSoirMode(false);
                  setSelectedDate(d);
                }}
                onLoadMore={loadMore}
                isLoadingMore={isLoadingMore}
              />
            </div>

            {/* Mobile : recherche + filtres à portée de pouce, toujours visibles */}
            <div className="md:hidden flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={() => setSearchOpen((v) => !v)}
                aria-expanded={searchOpen}
                aria-label="Rechercher un film"
                className="w-11 h-11 flex items-center justify-center rounded-lg border-2 border-sepia-chaud bg-creme-ecran text-noir-velours"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => setFiltersOpen(true)}
                aria-label="Filtres"
                className="relative w-11 h-11 flex items-center justify-center rounded-lg border-2 border-sepia-chaud bg-creme-ecran text-noir-velours"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-rouge-cinema text-creme-ecran text-[11px] font-bebas">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>

            {/* Desktop : bascule Affiche / Planning (sur mobile, ce sont les onglets bas) */}
            <div className="hidden md:flex shrink-0 rounded-lg border-2 border-sepia-chaud overflow-hidden">
              {([
                ['grid', 'Affiche'],
                ['planning', 'Planning'],
              ] as const).map(([mode, label]) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setViewMode(mode)}
                  aria-pressed={viewMode === mode}
                  className={`font-bebas px-3 py-1.5 text-sm uppercase tracking-wide transition-colors ${
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

          {searchOpen && (
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un film..."
              aria-label="Rechercher un film"
              className="md:hidden font-crimson w-full mt-2 px-3 min-h-[44px] bg-creme-ecran border-2 border-sepia-chaud rounded-lg text-noir-velours text-sm placeholder-sepia-chaud/60 focus:outline-none focus:ring-2 focus:ring-rouge-cinema focus:border-rouge-cinema"
            />
          )}

          <div className="md:hidden mt-2 empty:mt-0">
            <ActiveFilterTags cinemas={cinemas} />
          </div>
        </div>
      )}

      {/* Desktop : barre de filtres complète */}
      {!isLoading && !isError && hasFilms && (
        <div className="hidden md:block -mx-4 px-4 pb-3">
          <FilterBar cinemas={cinemas} activeFilterCount={activeFilterCount} />
        </div>
      )}

      <FilterSheet open={filtersOpen} onClose={() => setFiltersOpen(false)} cinemas={cinemas} />

      {/* Content area */}
      {isLoading && <FilmGridSkeleton />}

      {isError && (
        <ErrorState
          message="Impossible de charger les films. Verifiez votre connexion."
          onRetry={() => refetch()}
        />
      )}

      {!isLoading && !isError && !hasFilms && (
        <EmptyState
          message="Aucun film trouve sur les prochains jours"
          actionLabel="Charger une semaine de plus"
          onAction={loadMore}
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
          actionLabel="Voir tous les jours"
          onAction={() => setSelectedDate(null)}
        />
      )}

      {!isLoading && !isError && filteredFilms.length > 0 && (
        <div>
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
        films={rangeFilms}
        cityOf={cityOf}
        onFilmSelect={openDrawer}
      />
    </div>
  );
}
