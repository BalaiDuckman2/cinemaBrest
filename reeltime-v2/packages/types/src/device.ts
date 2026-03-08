import * as z from 'zod';

export const DevicePlatformSchema = z.enum(['web', 'ios', 'android']);
export type DevicePlatform = z.infer<typeof DevicePlatformSchema>;

export const DeviceTokenSchema = z.object({
  id: z.string().uuid(),
  token: z.string(),
  platform: DevicePlatformSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type DeviceToken = z.infer<typeof DeviceTokenSchema>;
