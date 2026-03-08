export { getShowtimesForCinema, getShowtimesForAllCinemas } from './allocineService.js';
export {
  parseAllocineResponse,
  hasMorePages,
  isEmptyResponse,
  type ParsedFilm,
  type ParsedShowtime,
} from './allocineParser.js';
export {
  getShowtimes,
  invalidateCache,
  invalidateL1,
  invalidateAllL1,
} from './cacheService.js';
export { startCacheScheduler, stopCacheScheduler, preloadAll } from './cacheScheduler.js';
export { runFullSync, getSyncState, type SyncResult } from './refreshService.js';
export {
  register as registerUser,
  login as loginUser,
  refresh as refreshUserToken,
  AuthError,
} from './authService.js';
export { getFilmsForWeek, getFilmById, getFilmsWithFilters, searchAllFilms, type SearchResult } from './filmService.js';
export { getAllCinemas, getCinemaShowtimes } from './cinemaService.js';
export { runAlertMatching } from './alertMatchingService.js';
export { sendToUser, sendPushNotification, isFirebaseConfigured } from './firebaseService.js';
