import * as z from 'zod';

/** Standard API error shape */
export const ApiErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z
    .array(
      z.object({
        path: z.string(),
        message: z.string(),
      }),
    )
    .optional(),
});

export type ApiError = z.infer<typeof ApiErrorSchema>;

/** Wrapper for successful responses: { data: T } */
export interface ApiResponse<T> {
  data: T;
}

/** Wrapper for paginated/meta responses: { data: T, meta: M } */
export interface ApiResponseWithMeta<T, M> {
  data: T;
  meta: M;
}

/** Wrapper for error responses: { error: ApiError } */
export interface ApiErrorResponse {
  error: ApiError;
}

/** Creates a Zod schema for { data: T } responses */
export function createApiResponseSchema<T extends z.ZodType>(dataSchema: T) {
  return z.object({
    data: dataSchema,
  });
}

/** Creates a Zod schema for { data: T, meta: M } responses */
export function createApiResponseWithMetaSchema<
  T extends z.ZodType,
  M extends z.ZodType,
>(dataSchema: T, metaSchema: M) {
  return z.object({
    data: dataSchema,
    meta: metaSchema,
  });
}

export const ErrorCodes = {
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  EMAIL_ALREADY_EXISTS: 'EMAIL_ALREADY_EXISTS',
  FILM_NOT_FOUND: 'FILM_NOT_FOUND',
  CINEMA_NOT_FOUND: 'CINEMA_NOT_FOUND',
  SHOWTIME_NOT_FOUND: 'SHOWTIME_NOT_FOUND',
  ALREADY_IN_WATCHLIST: 'ALREADY_IN_WATCHLIST',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  ALLOCINE_UNAVAILABLE: 'ALLOCINE_UNAVAILABLE',
  NOT_FOUND: 'NOT_FOUND',
  INVALID_PARAMS: 'INVALID_PARAMS',
} as const;
