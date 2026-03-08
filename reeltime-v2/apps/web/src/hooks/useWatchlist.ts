import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, ApiError } from '../services/api';
import { queryKeys } from '../services/queryKeys';
import { useAuthStore } from '../stores/authStore';

export interface WatchlistItem {
  id: string;
  filmTitle: string;
  cinemaName: string;
  date: string;
  time: string;
  version: string;
  bookingUrl: string | null;
  posterUrl: string | null;
  createdAt: string;
}

export interface AddToWatchlistInput {
  filmTitle: string;
  cinemaName: string;
  date: string;
  time: string;
  version: string;
  bookingUrl?: string | null;
  posterUrl?: string | null;
}

interface WatchlistResponse {
  data: WatchlistItem[];
}

interface AddWatchlistResponse {
  data: WatchlistItem;
}

export function useWatchlist() {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const query = useQuery({
    queryKey: queryKeys.watchlist.all,
    queryFn: () => apiFetch<WatchlistResponse>('/api/v1/me/watchlist'),
    enabled: isAuthenticated,
  });

  const addMutation = useMutation({
    mutationFn: (data: AddToWatchlistInput) =>
      apiFetch<AddWatchlistResponse>('/api/v1/me/watchlist', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onMutate: async (newItem) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.watchlist.all });
      const previous = queryClient.getQueryData<WatchlistResponse>(queryKeys.watchlist.all);
      queryClient.setQueryData<WatchlistResponse>(queryKeys.watchlist.all, (old) => ({
        data: [
          ...(old?.data ?? []),
          {
            ...newItem,
            id: 'temp-' + Date.now(),
            bookingUrl: newItem.bookingUrl ?? null,
            posterUrl: newItem.posterUrl ?? null,
            createdAt: new Date().toISOString(),
          },
        ],
      }));
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.watchlist.all, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.watchlist.all });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch<void>(`/api/v1/me/watchlist/${id}`, { method: 'DELETE' }),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.watchlist.all });
      const previous = queryClient.getQueryData<WatchlistResponse>(queryKeys.watchlist.all);
      queryClient.setQueryData<WatchlistResponse>(queryKeys.watchlist.all, (old) => ({
        data: (old?.data ?? []).filter((item) => item.id !== id),
      }));
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.watchlist.all, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.watchlist.all });
    },
  });

  const isInWatchlist = (filmTitle: string, cinemaName: string, date: string, time: string): boolean => {
    return (
      query.data?.data?.some(
        (item) =>
          item.filmTitle === filmTitle &&
          item.cinemaName === cinemaName &&
          item.date === date &&
          item.time === time,
      ) ?? false
    );
  };

  const findWatchlistItem = (
    filmTitle: string,
    cinemaName: string,
    date: string,
    time: string,
  ): WatchlistItem | undefined => {
    return query.data?.data?.find(
      (item) =>
        item.filmTitle === filmTitle &&
        item.cinemaName === cinemaName &&
        item.date === date &&
        item.time === time,
    );
  };

  return {
    items: query.data?.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    addMutation,
    removeMutation,
    isInWatchlist,
    findWatchlistItem,
  };
}
