import * as z from 'zod';

// --- Existing schemas (kept for backward compat) ---

export interface FilmListQuery {
  weekOffset: number;
}

export interface FilmIdParam {
  id: number;
}

export function parseFilmListQuery(query: Record<string, unknown>): FilmListQuery {
  const raw = query.weekOffset;
  if (raw === undefined || raw === null || raw === '') {
    return { weekOffset: 0 };
  }
  const num = Number(raw);
  if (!Number.isInteger(num) || num < -52 || num > 52) {
    throw new Error('weekOffset must be an integer between -52 and 52');
  }
  return { weekOffset: num };
}

export function parseFilmIdParam(params: Record<string, unknown>): FilmIdParam {
  const raw = params.id;
  const num = Number(raw);
  if (!Number.isInteger(num) || num <= 0) {
    throw new Error('id must be a positive integer');
  }
  return { id: num };
}

// --- Filter schemas (Zod) ---

export const filmFilterSchema = z.object({
  q: z.string().optional(),
  cinemaId: z.string().optional(),
  version: z.enum(['VO', 'VF', 'VOST']).optional(),
  minTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:mm)')
    .optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  weekOffset: z.coerce.number().int().min(-52).max(52).default(0),
});

export type FilmFilterInput = z.infer<typeof filmFilterSchema>;

export const filmSearchSchema = z.object({
  q: z.string().min(1, 'Search query is required'),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export type FilmSearchInput = z.infer<typeof filmSearchSchema>;
