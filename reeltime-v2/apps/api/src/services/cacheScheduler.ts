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
    '0 */6 * * *',
    async () => {
      logger.info({ msg: 'Scheduled background sync triggered' });
      await runFullSync(logger);
    },
    {
      timezone: config.timezone,
    },
  );

  logger.info(
    { timezone: config.timezone },
    'Cache scheduler started (every 6 hours)',
  );
}

export function stopCacheScheduler(): void {
  scheduledTask?.stop();
  scheduledTask = null;
}

export async function preloadAll(logger: Logger): Promise<void> {
  await runFullSync(logger);
}
