import * as z from 'zod';
import { VersionSchema } from './version.js';

// --- Film list / detail response shapes (as returned by the API) ---

export const ShowtimeEntrySchema = z.object({
  date: z.string(),           // YYYY-MM-DD
  time: z.string(),           // HH:MM
  version: z.string(),        // VF, VO, VOST, OTHER
  cinemaId: z.string(),       // allocineId
  cinemaName: z.string(),
  bookingUrl: z.string().nullable().optional(),
});

export type ShowtimeEntry = z.infer<typeof ShowtimeEntrySchema>;

export const FilmListItemSchema = z.object({
  id: z.number().int(),
  title: z.string(),
  year: z.number().int().nullable().optional(),
  posterUrl: z.string().nullable().optional(),
  director: z.string().nullable().optional(),
  genres: z.array(z.string()),
  filmAge: z.number().int().nullable().optional(),
  rating: z.number().nullable().optional(),
  totalShowtimes: z.number().int(),
  letterboxdUrl: z.string(),
  showtimes: z.array(ShowtimeEntrySchema),
});

export type FilmListItem = z.infer<typeof FilmListItemSchema>;

export const FilmListMetaSchema = z.object({
  weekStart: z.string(),
  weekEnd: z.string(),
  weekOffset: z.number().int(),
  totalFilms: z.number().int(),
});

export type FilmListMeta = z.infer<typeof FilmListMetaSchema>;

export const FilmDetailSchema = z.object({
  id: z.number().int(),
  title: z.string(),
  year: z.number().int().nullable().optional(),
  posterUrl: z.string().nullable().optional(),
  synopsis: z.string().nullable().optional(),
  cast: z.array(z.string()),
  director: z.string().nullable().optional(),
  genres: z.array(z.string()),
  runtime: z.number().int().nullable().optional(),
  rating: z.number().nullable().optional(),
  filmAge: z.number().int().nullable().optional(),
  letterboxdUrl: z.string(),
  showtimesByDate: z.record(z.string(), z.record(z.string(), z.array(ShowtimeEntrySchema))),
});

export type FilmDetail = z.infer<typeof FilmDetailSchema>;

// --- Cinema response shapes ---

export const CinemaListItemSchema = z.object({
  id: z.number().int(),
  allocineId: z.string(),
  name: z.string(),
  address: z.string().nullable().optional(),
  city: z.string(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
});

export type CinemaListItem = z.infer<typeof CinemaListItemSchema>;

export const CinemaFilmShowtimeSchema = z.object({
  time: z.string(),           // HH:MM
  version: z.string(),        // VF, VO, VOST
  bookingUrl: z.string().nullable().optional(),
});

export type CinemaFilmShowtime = z.infer<typeof CinemaFilmShowtimeSchema>;

export const CinemaFilmShowtimesSchema = z.object({
  id: z.number().int(),
  title: z.string(),
  posterUrl: z.string().nullable().optional(),
  year: z.number().int().nullable().optional(),
  director: z.string().nullable().optional(),
  genres: z.array(z.string()),
  showtimes: z.array(CinemaFilmShowtimeSchema),
});

export type CinemaFilmShowtimes = z.infer<typeof CinemaFilmShowtimesSchema>;

export const CinemaShowtimesResponseSchema = z.object({
  cinema: CinemaListItemSchema,
  date: z.string(),            // YYYY-MM-DD
  films: z.array(CinemaFilmShowtimesSchema),
});

export type CinemaShowtimesResponse = z.infer<typeof CinemaShowtimesResponseSchema>;
