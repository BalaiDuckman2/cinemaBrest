import { prisma } from '../lib/prisma.js';
import * as alertRepository from '../repositories/alertRepository.js';
import { sendToUser, type NotificationPayload } from './firebaseService.js';
import { normalizeText } from '../utils/searchUtils.js';
import type { AlertCriteria } from '../schemas/alerteSchema.js';

interface FilmWithShowtimes {
  allocineId: number;
  title: string;
  showtimes: Array<{
    date: string;
    time: string;
    version: string;
    cinemaId: string;
    cinemaName: string;
  }>;
}

interface Logger {
  info(obj: unknown, msg?: string): void;
  warn(obj: unknown, msg?: string): void;
  error(obj: unknown, msg?: string): void;
}

/**
 * Normalize a film title for fuzzy matching.
 * Removes accents, lowercases, and strips special characters.
 */
function normalizeTitle(title: string): string {
  return normalizeText(title).replace(/[^a-z0-9\s]/g, '').trim();
}

/**
 * Find a matching film using fuzzy title comparison.
 * Matches if either title contains the other (bidirectional).
 */
function findMatchingFilm(
  alertTitle: string,
  films: FilmWithShowtimes[],
): FilmWithShowtimes | null {
  const normalizedAlert = normalizeTitle(alertTitle);
  if (!normalizedAlert) return null;

  return (
    films.find((film) => {
      const normalizedFilm = normalizeTitle(film.title);
      return (
        normalizedFilm.includes(normalizedAlert) ||
        normalizedAlert.includes(normalizedFilm)
      );
    }) ?? null
  );
}

/**
 * Filter showtimes by alert criteria (AND logic).
 */
function filterByCriteria(
  showtimes: FilmWithShowtimes['showtimes'],
  criteria: AlertCriteria,
): FilmWithShowtimes['showtimes'] {
  return showtimes.filter((st) => {
    if (criteria.cinemaId && st.cinemaId !== criteria.cinemaId) return false;
    if (criteria.version && st.version !== criteria.version) return false;
    if (criteria.minTime && st.time < criteria.minTime) return false;
    return true;
  });
}

/**
 * Get all current films with their upcoming showtimes from the database.
 */
async function getCurrentFilmsWithShowtimes(): Promise<FilmWithShowtimes[]> {
  const today = new Date().toISOString().slice(0, 10);

  const films = await prisma.film.findMany({
    where: {
      showtimes: {
        some: {
          date: { gte: today },
        },
      },
    },
    include: {
      showtimes: {
        where: { date: { gte: today } },
        include: { cinema: true },
        orderBy: [{ date: 'asc' }, { startsAt: 'asc' }],
      },
    },
  });

  return films.map((film) => ({
    allocineId: film.allocineId,
    title: film.title,
    showtimes: film.showtimes.map((st) => ({
      date: st.date,
      time: st.startsAt.toISOString().substring(11, 16),
      version: st.version,
      cinemaId: st.cinema.allocineId,
      cinemaName: st.cinema.name,
    })),
  }));
}

/**
 * Build notification payload for a matched alert.
 */
function buildNotificationPayload(
  film: FilmWithShowtimes,
  nextShowtime: FilmWithShowtimes['showtimes'][0],
): NotificationPayload {
  return {
    notification: {
      title: 'Film disponible !',
      body: `${film.title} au ${nextShowtime.cinemaName} - ${nextShowtime.date} a ${nextShowtime.time}`,
    },
    data: {
      type: 'alert_match',
      filmId: String(film.allocineId),
      filmTitle: film.title,
      cinemaName: nextShowtime.cinemaName,
      deepLink: `reeltime://film/${film.allocineId}`,
      webLink: `https://reeltime.app/films/${film.allocineId}`,
    },
  };
}

/**
 * Run alert matching against all active alerts.
 * Called after a successful sync to notify users of newly available films.
 */
export async function runAlertMatching(logger: Logger): Promise<{
  matchCount: number;
  totalAlerts: number;
  duration: number;
}> {
  const startTime = Date.now();

  // Fetch active alerts (not already triggered)
  const activeAlerts = await alertRepository.getActiveAlerts();
  const untriggeredAlerts = activeAlerts.filter((a) => !a.triggeredAt);

  if (untriggeredAlerts.length === 0) {
    logger.info({}, 'No untriggered alerts to process');
    return { matchCount: 0, totalAlerts: 0, duration: Date.now() - startTime };
  }

  // Fetch current film data from database
  const currentFilms = await getCurrentFilmsWithShowtimes();

  logger.info(
    { alertCount: untriggeredAlerts.length, filmCount: currentFilms.length },
    'Starting alert matching',
  );

  let matchCount = 0;

  for (const alert of untriggeredAlerts) {
    try {
      const criteria = alertRepository.parseCriteria(alert.criteria);
      const matchedFilm = findMatchingFilm(alert.filmTitle, currentFilms);
      if (!matchedFilm) continue;

      const matchedShowtimes = filterByCriteria(
        matchedFilm.showtimes,
        criteria,
      );
      if (matchedShowtimes.length === 0) continue;

      // Send push notification (next available showtime)
      const nextShowtime = matchedShowtimes[0];
      const payload = buildNotificationPayload(matchedFilm, nextShowtime);

      try {
        const result = await sendToUser(alert.userId, payload);
        logger.info(
          {
            alertId: alert.id,
            userId: alert.userId,
            filmTitle: matchedFilm.title,
            cinemaName: nextShowtime.cinemaName,
            sent: result.sent,
            cleaned: result.cleaned,
          },
          'Alert matched and notification sent',
        );
      } catch (notifError) {
        // Log notification failure but still mark as triggered
        logger.warn(
          { alertId: alert.id, error: String(notifError) },
          'Push notification failed, marking alert as triggered anyway',
        );
      }

      // Mark alert as triggered
      await alertRepository.markTriggered(alert.id, new Date());
      matchCount++;
    } catch (error) {
      logger.error(
        { alertId: alert.id, error: String(error) },
        'Alert matching failed for this alert, continuing',
      );
    }
  }

  const duration = Date.now() - startTime;

  logger.info(
    {
      duration,
      matchCount,
      totalAlerts: untriggeredAlerts.length,
    },
    'Alert matching completed',
  );

  return { matchCount, totalAlerts: untriggeredAlerts.length, duration };
}
