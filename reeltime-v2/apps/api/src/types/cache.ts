import type { ParsedFilm, ParsedShowtime } from '../services/allocineParser.js';

export interface CachedShowtimeData {
  films: ParsedFilm[];
  showtimes: ParsedShowtime[];
}

export interface CachedResult {
  data: CachedShowtimeData;
  source: 'l1' | 'l2' | 'allocine' | 'l2-stale' | 'none';
  stale: boolean;
  error?: boolean;
}

// Cache key format: showtimes:{cinemaAllocineId}:{YYYY-MM-DD}
// Week key format:  week:{weekOffset}:{YYYY-MM-DD}

export function buildCacheKey(cinemaAllocineId: string, date: string): string {
  return `showtimes:${cinemaAllocineId}:${date}`;
}
