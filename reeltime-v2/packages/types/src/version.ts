import * as z from 'zod';

export const Version = {
  VF: 'VF',
  VO: 'VO',
  VOST: 'VOST',
  OTHER: 'OTHER',
} as const;

export type Version = (typeof Version)[keyof typeof Version];

export const VersionSchema = z.enum(['VF', 'VO', 'VOST', 'OTHER']);
