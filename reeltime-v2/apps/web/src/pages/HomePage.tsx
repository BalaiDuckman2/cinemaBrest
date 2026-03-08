import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { WeekNavigator } from '../components/WeekNavigator';
import { FilmGrid } from '../components/FilmGrid';
import { FilmDrawer } from '../components/FilmDrawer';
import { FilmGridSkeleton } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { FilterBar } from '../components/filters';
import { AlertForm } from '../components/alerts';
import { useFilms } from '../hooks/useFilms';
import { useWeekNavigation } from '../hooks/useWeekNavigation';
import { useFilmDrawer } from '../hooks/useFilmDrawer';
import { useFilteredFilms } from '../hooks/useFilteredFilms';
import { useCinemas } from '../hooks/useCinemas';
import { useFiltersStore } from '../stores/filtersStore';
import { useAuthStore } from '../stores/authStore';

const ALERT_PENDING_KEY = 'reeltime_pending_alert_title';

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

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className={`fixed bottom-4 right-4 md:bottom-8 md:right-8 bg-rouge-cinema hover:bg-bordeaux-profond text-creme-ecran p-3 md:p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-110 z-50 border-2 border-or-antique ${
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
  const navigate = useNavigate();
  const { weekOffset, goToNextWeek, goToPrevWeek, goToToday } = useWeekNavigation();
  const { data, isLoading, isError, refetch } = useFilms(weekOffset);
  const { isOpen, selectedFilm, openDrawer, closeDrawer } = useFilmDrawer();
  const { data: cinemas = [] } = useCinemas();
  const resetAll = useFiltersStore((s) => s.resetAll);
  const searchQuery = useFiltersStore((s) => s.searchQuery);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [showAlertForm, setShowAlertForm] = useState(false);
  const [alertDefaultTitle, setAlertDefaultTitle] = useState('');

  const { filteredFilms, activeFilterCount, hasActiveFilters } = useFilteredFilms(
    data?.films ?? [],
  );

  useEffect(() => {
    if (isAuthenticated) {
      const pendingTitle = sessionStorage.getItem(ALERT_PENDING_KEY);
      if (pendingTitle) {
        sessionStorage.removeItem(ALERT_PENDING_KEY);
        setAlertDefaultTitle(pendingTitle);
        setShowAlertForm(true);
      }
    }
  }, [isAuthenticated]);

  const handleCreateAlert = () => {
    const title = searchQuery.trim();
    if (isAuthenticated) {
      setAlertDefaultTitle(title);
      setShowAlertForm(true);
    } else {
      if (title) {
        sessionStorage.setItem(ALERT_PENDING_KEY, title);
      }
      navigate('/login', { state: { from: { pathname: '/' } } });
    }
  };

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

      {/* Filters */}
      {!isLoading && !isError && hasFilms && (
        <div className="mb-4">
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

          <div className="flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={resetAll}
              className="font-bebas rounded bg-rouge-cinema px-5 py-2 text-sm text-creme-ecran uppercase tracking-wide transition-colors hover:bg-bordeaux-profond"
            >
              Reinitialiser les filtres
            </button>

            {searchQuery && (
              <button
                type="button"
                onClick={handleCreateAlert}
                className="font-bebas rounded bg-or-antique px-5 py-2 text-sm text-noir-velours uppercase tracking-wide transition-colors hover:bg-jaune-marquise"
              >
                Creer une alerte
              </button>
            )}
          </div>
        </div>
      )}

      {!isLoading && !isError && filteredFilms.length > 0 && (
        <FilmGrid films={filteredFilms} onFilmClick={openDrawer} />
      )}

      {/* Film drawer */}
      <FilmDrawer film={selectedFilm} isOpen={isOpen} onClose={closeDrawer} />

      {/* Alert creation modal */}
      {showAlertForm && (
        <AlertForm
          defaultTitle={alertDefaultTitle}
          onClose={() => setShowAlertForm(false)}
        />
      )}
    </div>
  );
}
