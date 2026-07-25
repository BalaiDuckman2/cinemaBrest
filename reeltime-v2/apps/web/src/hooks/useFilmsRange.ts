import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import { fetchFilms, type FilmsData } from '../api/filmsApi';
import { queryKeys } from '../services/queryKeys';
import { mergeFilmPages } from '../utils/mergeFilms';
import { localISODate, rangeDates, rangeEnd, weeksNeededFor } from '../utils/dates';
import type { FilmListItem } from '../types/components';

/** Nombre de semaines chargées au démarrage : garantit une fenêtre de 8 à 14 jours. */
const INITIAL_WEEKS = 2;

export interface FilmsRange {
  films: FilmListItem[];
  dates: string[];
  rangeStart: string;
  rangeEnd: string;
  isLoading: boolean;
  isLoadingMore: boolean;
  isError: boolean;
  refetch: () => void;
  loadMore: () => void;
  weeks: number;
}

/**
 * Catalogue sur une fenêtre glissante démarrant aujourd'hui, et non sur la
 * semaine calendaire. `targetDate` (typiquement le `?date=` de l'URL) étend
 * automatiquement le chargement si la date visée tombe au-delà de la fenêtre.
 */
export function useFilmsRange(targetDate?: string | null): FilmsRange {
  const today = localISODate();
  const [weeks, setWeeks] = useState(INITIAL_WEEKS);

  useEffect(() => {
    if (!targetDate) return;
    const needed = weeksNeededFor(targetDate, today);
    setWeeks((w) => (needed > w ? needed : w));
  }, [targetDate, today]);

  const results = useQueries({
    queries: Array.from({ length: weeks }, (_, offset) => ({
      queryKey: queryKeys.films.week(offset),
      queryFn: () => fetchFilms(offset),
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
    })),
  });

  const to = rangeEnd(today, weeks);

  // `results` est un nouveau tableau à chaque rendu, mais les `data` de React
  // Query sont stables : `dataUpdatedAt` suffit à détecter un vrai changement.
  const signature = results.map((r) => r.dataUpdatedAt).join('|');

  const films = useMemo(
    () =>
      mergeFilmPages(
        results.map((r) => r.data).filter((d): d is FilmsData => d != null),
        today,
        to,
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [signature, today, to],
  );

  const dates = useMemo(() => rangeDates(today, to), [today, to]);

  const refetch = useCallback(() => {
    for (const r of results) r.refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  const loadMore = useCallback(() => setWeeks((w) => w + 1), []);

  return {
    films,
    dates,
    rangeStart: today,
    rangeEnd: to,
    // La première semaine seule pilote le squelette : ajouter une semaine via
    // loadMore() ne doit pas faire disparaître la liste déjà affichée.
    isLoading: results[0]?.isLoading ?? true,
    isLoadingMore: results.slice(1).some((r) => r.isLoading),
    isError: results[0]?.isError ?? false,
    refetch,
    loadMore,
    weeks,
  };
}
