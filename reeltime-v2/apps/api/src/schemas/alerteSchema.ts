import * as z from 'zod';

export const alertCriteriaSchema = z.object({
  cinemaId: z.string().optional(),
  version: z.enum(['VF', 'VO', 'VOST']).optional(),
  minTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, 'minTime must be HH:MM format')
    .optional(),
});

export type AlertCriteria = z.infer<typeof alertCriteriaSchema>;

export const createAlertSchema = z.object({
  filmTitle: z.string().min(1, 'Film title is required').max(200),
  criteria: alertCriteriaSchema.optional().default({}),
});

export type CreateAlertInput = z.infer<typeof createAlertSchema>;

export const alertParamsSchema = z.object({
  id: z.string().uuid('Invalid alert ID'),
});

export type AlertParams = z.infer<typeof alertParamsSchema>;
