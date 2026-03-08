import * as z from 'zod';

export const addToWatchlistSchema = z.object({
  filmTitle: z.string().min(1, 'Film title is required'),
  cinemaName: z.string().min(1, 'Cinema name is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format'),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be HH:MM format'),
  version: z.string().min(1, 'Version is required'),
  bookingUrl: z.string().url().optional(),
  posterUrl: z.string().url().optional(),
});

export type AddToWatchlistInput = z.infer<typeof addToWatchlistSchema>;

export const watchlistParamsSchema = z.object({
  id: z.string().uuid('Invalid watchlist item ID'),
});

export type WatchlistParams = z.infer<typeof watchlistParamsSchema>;
