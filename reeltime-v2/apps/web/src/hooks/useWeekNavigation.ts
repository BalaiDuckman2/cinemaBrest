import { useState, useCallback, useEffect } from 'react';

/**
 * Décalage en semaines par rapport à la semaine courante, synchronisé avec
 * `?week=` dans l'URL pour qu'un lien partagé désigne bien une semaine. Le
 * paramètre est absent quand on est sur la semaine courante.
 */
export function useWeekNavigation() {
  const [weekOffset, setWeekOffset] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return parseInt(params.get('week') ?? '0', 10) || 0;
  });

  useEffect(() => {
    const url = new URL(window.location.href);
    if (weekOffset === 0) {
      url.searchParams.delete('week');
    } else {
      url.searchParams.set('week', String(weekOffset));
    }
    // Sans ce garde, le premier rendu empile une entrée d'historique identique
    // à l'URL courante : il faudrait alors deux « retour » pour quitter la page.
    if (url.toString() !== window.location.href) {
      window.history.pushState({}, '', url.toString());
    }
  }, [weekOffset]);

  // Retour arrière navigateur.
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      setWeekOffset(parseInt(params.get('week') ?? '0', 10) || 0);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return {
    weekOffset,
    goToNextWeek: useCallback(() => setWeekOffset((w) => w + 1), []),
    goToPrevWeek: useCallback(() => setWeekOffset((w) => w - 1), []),
    goToToday: useCallback(() => setWeekOffset(0), []),
  };
}
