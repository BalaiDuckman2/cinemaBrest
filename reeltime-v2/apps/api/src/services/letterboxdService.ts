import { prisma } from '../lib/prisma.js';
import { config } from '../config/index.js';
import { RateLimiter } from '../utils/rateLimiter.js';
import { fetchTmdbId, fetchLetterboxdRatingByTmdbId } from './letterboxdEnrich.js';
import { invalidateAllL1 } from './cacheService.js';

interface Logger {
  info(obj: unknown, msg?: string): void;
  warn(obj: unknown, msg?: string): void;
  error(obj: unknown, msg?: string): void;
}

const STALE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
// Enrich the whole catalogue in one background run. Politeness toward
// TMDB/Letterboxd is enforced by the rate limiter below (one call per 1.5s),
// not by capping the batch — a low cap (was 40) left most films unrated.
// This high value is only a safety valve against an unbounded run.
const MAX_FILMS_PER_RUN = 2000;
const rateLimiter = new RateLimiter(1500);

let isEnriching = false;

/** Enrich films missing a recent Letterboxd rating. Background-only, never throws. */
export async function runLetterboxdEnrichment(logger: Logger): Promise<void> {
  if (!config.tmdbApiKey) {
    logger.warn({ msg: 'TMDB_API_KEY not set, skipping Letterboxd enrichment' });
    return;
  }
  if (isEnriching) {
    logger.warn({ msg: 'Letterboxd enrichment already running, skipping' });
    return;
  }
  isEnriching = true;
  const staleBefore = new Date(Date.now() - STALE_MS);

  try {
    const films = await prisma.film.findMany({
      where: {
        OR: [{ letterboxdFetchedAt: null }, { letterboxdFetchedAt: { lt: staleBefore } }],
      },
      select: { id: true, title: true, year: true, productionYear: true },
      take: MAX_FILMS_PER_RUN,
    });

    logger.info({ count: films.length }, 'Letterboxd enrichment started');

    let updated = 0;
    for (const film of films) {
      try {
        await rateLimiter.acquire();
        const tmdbId = await fetchTmdbId(
          config.tmdbApiKey,
          film.title,
          film.productionYear ?? film.year,
        );
        let rating: number | null = null;
        if (tmdbId != null) {
          await rateLimiter.acquire();
          rating = await fetchLetterboxdRatingByTmdbId(tmdbId);
        }
        await prisma.film.update({
          where: { id: film.id },
          data: { tmdbId, letterboxdRating: rating, letterboxdFetchedAt: new Date() },
        });
        if (rating != null) updated++;
      } catch (err) {
        // Mark as fetched so we don't retry this film in a tight loop.
        await prisma.film
          .update({ where: { id: film.id }, data: { letterboxdFetchedAt: new Date() } })
          .catch(() => {});
        logger.error({ film: film.title, error: String(err) }, 'Letterboxd enrichment failed for film');
      }
    }

    logger.info({ processed: films.length, rated: updated }, 'Letterboxd enrichment complete');

    // L1 entries were built before these ratings existed — drop them so the
    // next request rebuilds from L2/DB with the fresh ratings.
    if (updated > 0) {
      invalidateAllL1();
    }
  } catch (err) {
    logger.error({ error: String(err) }, 'Letterboxd enrichment run failed');
  } finally {
    isEnriching = false;
  }
}
