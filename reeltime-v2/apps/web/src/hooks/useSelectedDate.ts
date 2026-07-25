import { useEffect, useRef } from 'react';
import { useFiltersStore } from '../stores/filtersStore';

function dateFromUrl(): string | null {
  const raw = new URLSearchParams(window.location.search).get('date');
  return raw && /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : null;
}

/**
 * Lie `selectedDate` du store au paramètre `?date=` de l'URL, pour qu'un lien
 * partagé désigne un jour et non un décalage relatif à la date d'ouverture.
 * Un `?week=` résiduel des anciennes URL est simplement ignoré.
 */
export function useSelectedDate() {
  const selectedDate = useFiltersStore((s) => s.selectedDate);
  const setSelectedDate = useFiltersStore((s) => s.setSelectedDate);
  const initialised = useRef(false);

  // Lecture initiale.
  useEffect(() => {
    const fromUrl = dateFromUrl();
    if (fromUrl) setSelectedDate(fromUrl);
  }, [setSelectedDate]);

  // Écriture vers l'URL. Le premier passage est ignoré : il aurait effacé le
  // `?date=` de l'URL avant que la lecture initiale ne soit appliquée au store.
  useEffect(() => {
    if (!initialised.current) {
      initialised.current = true;
      return;
    }
    const url = new URL(window.location.href);
    if (selectedDate) url.searchParams.set('date', selectedDate);
    else url.searchParams.delete('date');
    if (url.toString() !== window.location.href) {
      window.history.pushState({}, '', url.toString());
    }
  }, [selectedDate]);

  // Retour arrière navigateur.
  useEffect(() => {
    const onPop = () => setSelectedDate(dateFromUrl());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [setSelectedDate]);

  return { selectedDate, setSelectedDate };
}
