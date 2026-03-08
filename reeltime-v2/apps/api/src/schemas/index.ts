export {
  registerSchema,
  loginSchema,
  refreshSchema,
  type RegisterInput,
  type LoginInput,
  type RefreshInput,
} from './authSchema.js';

export {
  addToWatchlistSchema,
  watchlistParamsSchema,
  type AddToWatchlistInput,
  type WatchlistParams,
} from './watchlistSchema.js';

export {
  parseCinemaIdParam,
  parseCinemaShowtimesQuery,
  type CinemaIdParam,
  type CinemaShowtimesQuery,
} from './cinemaSchemas.js';

export {
  createAlertSchema,
  alertCriteriaSchema,
  alertParamsSchema,
  type CreateAlertInput,
  type AlertCriteria,
  type AlertParams,
} from './alerteSchema.js';
