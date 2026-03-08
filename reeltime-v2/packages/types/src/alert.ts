import * as z from 'zod';

export const AlertCriteriaSchema = z.object({
  cinemaId: z.string().optional(),
  version: z.enum(['VF', 'VO', 'VOST']).optional(),
  minTime: z.string().optional(),
});

export type AlertCriteria = z.infer<typeof AlertCriteriaSchema>;

export const AlertStatusSchema = z.enum(['active', 'triggered', 'expired']);
export type AlertStatus = z.infer<typeof AlertStatusSchema>;

export const AlertSchema = z.object({
  id: z.string().uuid(),
  filmTitle: z.string(),
  criteria: AlertCriteriaSchema,
  isActive: z.boolean(),
  status: AlertStatusSchema,
  createdAt: z.string(),
  triggeredAt: z.string().nullable().optional(),
});

export type Alert = z.infer<typeof AlertSchema>;
