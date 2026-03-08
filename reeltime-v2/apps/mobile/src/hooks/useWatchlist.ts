import { useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../services/queryKeys';
import { apiClient, ApiError } from '../services/api';
import { useAuthStore } from '../stores/useAuthStore';

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

interface WatchlistResponse {
  data: WatchlistItem[];
}

interface AddToWatchlistInput {
  filmTitle: string;
  cinemaName: string;
  date: string;
  time: string;
  version: string;
  bookingUrl?: string;
  posterUrl?: string;
}

interface AddWatchlistResponse {
  data: WatchlistItem;
}

export function useWatchlist() {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const pendingDeleteRef = useRef<{ id: string; item: WatchlistItem } | null>(null);

  const query = useQuery<WatchlistResponse>({
    queryKey: queryKeys.watchlist.all,
    queryFn: () => apiClient<WatchlistResponse>('/api/v1/me/watchlist'),
    enabled: isAuthenticated,
  });

  const addMutation = useMutation({
    mutationFn: (input: AddToWatchlistInput) =>
      apiClient<AddWatchlistResponse>('/api/v1/me/watchlist', {
        method: 'POST',
        body: input,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.watchlist.all });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) =>
      apiClient<void>(`/api/v1/me/watchlist/${id}`, { method: 'DELETE' }),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.watchlist.all });
      const previous = queryClient.getQueryData<WatchlistResponse>(queryKeys.watchlist.all);
      queryClient.setQueryData<WatchlistResponse>(queryKeys.watchlist.all, (old) => {
        if (!old) return old;
        return { data: old.data.filter((item) => item.id !== id) };
      });
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.watchlist.all, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.watchlist.all });
    },
  });

  const items = query.data?.data ?? [];

  const isInWatchlist = useCallback(
    (filmTitle: string, cinemaName: string, date: string, time: string): boolean => {
      return items.some(
        (item) =>
          item.filmTitle === filmTitle &&
          item.cinemaName === cinemaName &&
          item.date === date &&
          item.time === time,
      );
    },
    [items],
  );

  const findWatchlistItem = useCallback(
    (filmTitle: string, cinemaName: string, date: string, time: string): WatchlistItem | undefined => {
      return items.find(
        (item) =>
          item.filmTitle === filmTitle &&
          item.cinemaName === cinemaName &&
          item.date === date &&
          item.time === time,
      );
    },
    [items],
  );

  const addToWatchlist = useCallback(
    async (input: AddToWatchlistInput) => {
      try {
        await addMutation.mutateAsync(input);
        return true;
      } catch (err) {
        if (err instanceof ApiError && err.code === 'ALREADY_IN_WATCHLIST') {
          return true; // Already there, consider it a success
        }
        return false;
      }
    },
    [addMutation],
  );

  const removeFromWatchlist = useCallback(
    async (id: string) => {
      removeMutation.mutate(id);
    },
    [removeMutation],
  );

  /** Remove with undo support: optimistically removes and returns an undo function */
  const removeWithUndo = useCallback(
    (id: string): (() => void) => {
      const item = items.find((i) => i.id === id);
      if (!item) {
        removeMutation.mutate(id);
        return () => {};
      }

      // Optimistically remove from cache
      queryClient.setQueryData<WatchlistResponse>(queryKeys.watchlist.all, (old) => {
        if (!old) return old;
        return { data: old.data.filter((i) => i.id !== id) };
      });

      // Clear any previous pending delete timer
      if (undoTimerRef.current) {
        clearTimeout(undoTimerRef.current);
        // Execute the previous pending delete immediately
        if (pendingDeleteRef.current) {
          removeMutation.mutate(pendingDeleteRef.current.id);
        }
      }

      pendingDeleteRef.current = { id, item };

      // Schedule actual deletion after 5 seconds
      undoTimerRef.current = setTimeout(() => {
        if (pendingDeleteRef.current?.id === id) {
          removeMutation.mutate(id);
          pendingDeleteRef.current = null;
        }
      }, 5000);

      // Return undo function
      return () => {
        if (undoTimerRef.current) {
          clearTimeout(undoTimerRef.current);
        }
        if (pendingDeleteRef.current?.id === id) {
          // Restore the item in cache
          queryClient.setQueryData<WatchlistResponse>(queryKeys.watchlist.all, (old) => {
            if (!old) return { data: [item] };
            return { data: [...old.data, item].sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time)) };
          });
          pendingDeleteRef.current = null;
        }
      };
    },
    [items, removeMutation, queryClient],
  );

  return {
    items,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    isRefetching: query.isRefetching,
    isInWatchlist,
    findWatchlistItem,
    addToWatchlist,
    removeFromWatchlist,
    removeWithUndo,
    isAdding: addMutation.isPending,
    isRemoving: removeMutation.isPending,
  };
}
