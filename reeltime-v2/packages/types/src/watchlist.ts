import * as z from 'zod';

export const WatchlistItemSchema = z.object({
  id: z.string().uuid(),
  filmTitle: z.string(),
  cinemaName: z.string(),
  date: z.string(),       // YYYY-MM-DD
  time: z.string(),       // HH:MM
  version: z.string(),
  bookingUrl: z.string().nullable().optional(),
  posterUrl: z.string().nullable().optional(),
  createdAt: z.string(),
});

export type WatchlistItem = z.infer<typeof WatchlistItemSchema>;
