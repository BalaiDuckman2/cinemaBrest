import { buildApp } from './app.js';
import { config } from './config/index.js';
import { CINEMAS } from './config/cinemas.js';
import { prisma } from './lib/prisma.js';
import { startCacheScheduler, stopCacheScheduler } from './services/cacheScheduler.js';
import { runFullSync } from './services/refreshService.js';

async function seedCinemas() {
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
}

async function start() {
  const app = await buildApp();

  // Seed cinemas into DB (idempotent upsert)
  await seedCinemas();
  app.log.info(`Cinemas seeded: ${CINEMAS.length} upserted`);

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

  // Start the midnight sync scheduler
  startCacheScheduler(app.log);

  // Initial sync (unless SKIP_PRELOAD is true)
  if (!config.skipPreload) {
    app.log.info('Starting initial data preload (async)...');
    runFullSync(app.log).catch((err) =>
      app.log.error(err, 'Initial preload failed'),
    );
  } else {
    app.log.info('SKIP_PRELOAD=true, skipping initial data preload');
  }

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
