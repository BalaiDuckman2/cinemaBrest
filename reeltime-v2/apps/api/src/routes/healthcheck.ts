import { FastifyInstance } from 'fastify';
import { getSyncState } from '../services/refreshService.js';

export async function healthcheckRoutes(app: FastifyInstance) {
  app.get('/healthcheck', async () => {
    const sync = getSyncState();
    return {
      status: 'ok',
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      sync: {
        isSyncing: sync.isSyncing,
        lastSyncAt: sync.lastSyncAt?.toISOString() ?? null,
        lastResult: sync.lastSyncResult
          ? {
              duration: sync.lastSyncResult.duration,
              cinemasProcessed: sync.lastSyncResult.cinemasProcessed,
              cinemasErrored: sync.lastSyncResult.cinemasErrored,
              totalFilms: sync.lastSyncResult.totalFilms,
              totalShowtimes: sync.lastSyncResult.totalShowtimes,
            }
          : null,
      },
    };
  });
}
