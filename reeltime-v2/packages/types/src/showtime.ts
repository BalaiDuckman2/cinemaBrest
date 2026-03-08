import * as z from 'zod';
import { VersionSchema } from './version.js';

export const ShowtimeSchema = z.object({
  id: z.number().int(),
  filmId: z.number().int(),
  cinemaId: z.number().int(),
  date: z.string(),        // YYYY-MM-DD
  startsAt: z.string(),    // ISO datetime
  version: VersionSchema,
  bookingUrl: z.string().nullable().optional(),
});

export type Showtime = z.infer<typeof ShowtimeSchema>;
