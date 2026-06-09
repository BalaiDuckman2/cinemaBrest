import { prisma } from '../lib/prisma.js';
import { config } from '../config/index.js';
import { RateLimiter } from '../utils/rateLimiter.js';
import { fetchTmdbId, fetchLetterboxdRatingByTmdbId } from './letterboxdEnrich.js';

interface Logger {
  info(obj: unknown, msg?: string): void;
  warn(obj: unknown, msg?: string): void;
  error(obj: unknown, msg?: string): void;
}

const STALE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const BATCH_LIMIT = 40; // cap work per run to stay gentle on TMDB/Letterboxd
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
      take: BATCH_LIMIT,
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
  } catch (err) {
    logger.error({ error: String(err) }, 'Letterboxd enrichment run failed');
  } finally {
    isEnriching = false;
  }
}
