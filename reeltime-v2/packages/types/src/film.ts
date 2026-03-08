import * as z from 'zod';

export const FilmSchema = z.object({
  id: z.number().int(),
  allocineId: z.number().int(),
  title: z.string(),
  year: z.number().int().nullable().optional(),
  posterUrl: z.string().nullable().optional(),
  synopsis: z.string().nullable().optional(),
  cast: z.array(z.string()),
  director: z.string().nullable().optional(),
  rating: z.number().min(0).max(5).nullable().optional(),
  productionYear: z.number().int().nullable().optional(),
  releaseDate: z.string().nullable().optional(),
  runtime: z.number().int().nullable().optional(),
  genres: z.array(z.string()),
  filmAge: z.number().int().nullable().optional(),
});

export type Film = z.infer<typeof FilmSchema>;
