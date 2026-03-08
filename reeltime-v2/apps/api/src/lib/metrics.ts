// All metrics are now defined in plugins/prometheus.ts.
// This file re-exports for any remaining consumers.
export {
  registry,
  cacheHitsTotal,
  cacheMissesTotal,
  cacheInvalidationsTotal,
  cacheEntriesL1Gauge,
  allocineApiCallsTotal,
  filmsCountGauge,
  showtimesCountGauge,
} from '../plugins/prometheus.js';
