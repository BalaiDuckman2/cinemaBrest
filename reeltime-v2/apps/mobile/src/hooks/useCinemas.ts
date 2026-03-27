import { useQuery } from '@tanstack/react-query';
import { fetchCinemas } from '../api/cinemasApi';
import { queryKeys } from '../services/queryKeys';

export function useCinemas() {
  return useQuery({
    queryKey: queryKeys.cinemas.all,
    queryFn: fetchCinemas,
    staleTime: 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
  });
}
