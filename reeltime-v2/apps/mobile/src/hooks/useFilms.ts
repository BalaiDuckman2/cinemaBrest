import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../services/queryKeys';
import { fetchFilms, type FilmsData } from '../api/filmsApi';

export function useFilms(weekOffset: number) {
  return useQuery<FilmsData>({
    queryKey: queryKeys.films.week(weekOffset),
    queryFn: () => fetchFilms(weekOffset),
  });
}
