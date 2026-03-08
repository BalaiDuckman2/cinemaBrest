import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import client from 'prom-client';

// Singleton registry
export const registry = new client.Registry();

// Collect default Node.js metrics (CPU, memory, event loop, etc.)
client.collectDefaultMetrics({ register: registry });

// --- HTTP metrics ---

export const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status_code'] as const,
  registers: [registry],
});

export const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route'] as const,
  registers: [registry],
});

// --- AlloCine API metrics ---

export const allocineApiCallsTotal = new client.Counter({
  name: 'allocine_api_calls_total',
  help: 'Total AlloCine API calls',
  labelNames: ['cinema', 'status'] as const,
  registers: [registry],
});

// --- Cache metrics ---

export const cacheHitsTotal = new client.Counter({
  name: 'cache_hits_total',
  help: 'Total cache hits',
  labelNames: ['level'] as const,
  registers: [registry],
});

export const cacheMissesTotal = new client.Counter({
  name: 'cache_misses_total',
  help: 'Total cache misses',
  labelNames: ['level'] as const,
  registers: [registry],
});

export const cacheInvalidationsTotal = new client.Counter({
  name: 'cache_invalidations_total',
  help: 'Total cache invalidations',
  registers: [registry],
});

export const cacheEntriesL1Gauge = new client.Gauge({
  name: 'cache_entries_l1_count',
  help: 'Current number of entries in L1 cache',
  registers: [registry],
});

// --- Data metrics ---

export const filmsCountGauge = new client.Gauge({
  name: 'films_count',
  help: 'Current number of films in database',
  registers: [registry],
});

export const showtimesCountGauge = new client.Gauge({
  name: 'showtimes_count',
  help: 'Current number of showtimes in database',
  registers: [registry],
});

// --- Prometheus plugin ---

async function prometheusPlugin(fastify: FastifyInstance) {
  // GET /metrics - Prometheus scrape endpoint (no auth required)
  fastify.get('/metrics', async (_request, reply) => {
    reply.header('Content-Type', registry.contentType);
    return registry.metrics();
  });

  // Hook to track HTTP request metrics (skip /metrics itself)
  fastify.addHook('onResponse', (request, reply, done) => {
    const route = request.routeOptions?.url || request.url;

    // Skip /metrics to avoid self-referencing
    if (route === '/metrics') {
      done();
      return;
    }

    httpRequestsTotal.inc({
      method: request.method,
      route,
      status_code: reply.statusCode,
    });

    httpRequestDuration.observe(
      { method: request.method, route },
      reply.elapsedTime / 1000,
    );

    done();
  });
}

export default fp(prometheusPlugin, { name: 'prometheus' });
