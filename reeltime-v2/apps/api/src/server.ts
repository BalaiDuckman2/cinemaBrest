import { buildApp } from './app.js';
import { config } from './config/index.js';
import { CINEMAS } from './config/cinemas.js';
import { prisma } from './lib/prisma.js';
import { startCacheScheduler, stopCacheScheduler } from './services/cacheScheduler.js';
import { runFullSync } from './services/refreshService.js';
import { runLetterboxdEnrichment } from './services/letterboxdService.js';

async function seedCinemas(): Promise<number> {
  for (const cinema of CINEMAS) {
    await prisma.cinema.upsert({
      where: { allocineId: cinema.allocineId },
      update: {
        name: cinema.name,
        address: cinema.address,
        city: cinema.city,
        latitude: cinema.latitude,
        longitude: cinema.longitude,
      },
      create: cinema,
    });
  }

  // Config is the source of truth: prune cinemas no longer listed in CINEMAS.
  // Their showtimes are removed automatically via onDelete: Cascade.
  const { count } = await prisma.cinema.deleteMany({
    where: { allocineId: { notIn: CINEMAS.map((c) => c.allocineId) } },
  });
  return count;
}

async function start() {
  const app = await buildApp();

  // Seed cinemas into DB (idempotent upsert + prune of cinemas removed from config)
  const prunedCinemas = await seedCinemas();
  app.log.info(`Cinemas seeded: ${CINEMAS.length} upserted, ${prunedCinemas} pruned`);

  // Initial sync strategy: API must never serve empty.
  //   - If DB is empty (first deploy) → BLOCKING sync before listen()
  //   - If DB already has cached data → background sync (non-blocking)
  if (!config.skipPreload) {
    const cachedEntries = await prisma.cacheMetadata.count();
    if (cachedEntries === 0) {
      app.log.info('No cached showtimes found — running blocking initial sync before accepting requests...');
      await runFullSync(app.log);
      // Kick off Letterboxd enrichment right after first sync (non-blocking)
      void runLetterboxdEnrichment(app.log);
    } else {
      app.log.info({ cachedEntries }, 'Existing cache detected, starting background sync (async)');
      runFullSync(app.log)
        .then(() => runLetterboxdEnrichment(app.log))
        .catch((err) => app.log.error(err, 'Background sync failed'));
    }
  } else {
    app.log.info('SKIP_PRELOAD=true, skipping initial data preload');
    // Still enrich whatever films are already in the DB (no-op without TMDB_API_KEY).
    void runLetterboxdEnrichment(app.log);
  }

  try {
    await app.listen({ port: config.port, host: config.host });
    app.log.info(
      {
        port: config.port,
        host: config.host,
        environment: config.nodeEnv,
        logLevel: config.logLevel,
        nodeVersion: process.version,
      },
      'ReelTime API started',
    );
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }

  // Start the recurring background sync scheduler (every 6 hours)
  startCacheScheduler(app.log);

  // Graceful shutdown
  const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
  for (const signal of signals) {
    process.on(signal, async () => {
      app.log.info(`Received ${signal}, shutting down gracefully...`);
      stopCacheScheduler();
      await app.close();
      process.exit(0);
    });
  }
}

start();
