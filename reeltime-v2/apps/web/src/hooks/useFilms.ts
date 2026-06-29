import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { fetchFilms } from '../api/filmsApi';
import { queryKeys } from '../services/queryKeys';

export function useFilms(weekOffset: number) {
  return useQuery({
    queryKey: queryKeys.films.week(weekOffset),
    queryFn: () => fetchFilms(weekOffset),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    // Keep showing the previous week while the next one loads (no skeleton flash)
    placeholderData: keepPreviousData,
  });
}
