// Version
export { Version, VersionSchema } from './version.js';
export type { Version as VersionType } from './version.js';

// Core models
export type { Film } from './film.js';
export { FilmSchema } from './film.js';

export type { Cinema } from './cinema.js';
export { CinemaSchema } from './cinema.js';

export type { Showtime } from './showtime.js';
export { ShowtimeSchema } from './showtime.js';



// API response shapes
export type {
  ShowtimeEntry,
  FilmListItem,
  FilmListMeta,
  FilmDetail,
  CinemaListItem,
  CinemaFilmShowtime,
  CinemaFilmShowtimes,
  CinemaShowtimesResponse,
} from './responses.js';
export {
  ShowtimeEntrySchema,
  FilmListItemSchema,
  FilmListMetaSchema,
  FilmDetailSchema,
  CinemaListItemSchema,
  CinemaFilmShowtimeSchema,
  CinemaFilmShowtimesSchema,
  CinemaShowtimesResponseSchema,
} from './responses.js';

// API wrapper types
export type { ApiResponse, ApiResponseWithMeta, ApiError, ApiErrorResponse } from './api.js';
export {
  ApiErrorSchema,
  createApiResponseSchema,
  createApiResponseWithMetaSchema,
  ErrorCodes,
} from './api.js';
