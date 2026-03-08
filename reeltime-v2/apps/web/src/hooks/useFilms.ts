import { useQuery } from '@tanstack/react-query';
import { fetchFilms } from '../api/filmsApi';
import { queryKeys } from '../services/queryKeys';

export function useFilms(weekOffset: number) {
  return useQuery({
    queryKey: queryKeys.films.week(weekOffset),
    queryFn: () => fetchFilms(weekOffset),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}
