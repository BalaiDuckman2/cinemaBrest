import cron from 'node-cron';
import { runFullSync } from './refreshService.js';
import { config } from '../config/index.js';

let scheduledTask: cron.ScheduledTask | null = null;

interface Logger {
  info(obj: unknown, msg?: string): void;
  warn(obj: unknown, msg?: string): void;
  error(obj: unknown, msg?: string): void;
}

export function startCacheScheduler(logger: Logger): void {
  scheduledTask = cron.schedule(
    '0 0 * * *',
    async () => {
      logger.info({ msg: 'Midnight sync triggered' });
      await runFullSync(logger);
    },
    {
      timezone: config.timezone,
    },
  );

  logger.info(
    { timezone: config.timezone },
    'Cache scheduler started (midnight daily)',
  );
}

export function stopCacheScheduler(): void {
  scheduledTask?.stop();
  scheduledTask = null;
}

export async function preloadAll(logger: Logger): Promise<void> {
  await runFullSync(logger);
}
