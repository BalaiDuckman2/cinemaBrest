import * as z from 'zod';

export const CinemaSchema = z.object({
  id: z.number().int(),
  allocineId: z.string(),
  name: z.string(),
  address: z.string().nullable().optional(),
  city: z.string(),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
});

export type Cinema = z.infer<typeof CinemaSchema>;
