import type { FilmListItem } from '../types/components';

/** Plage horaire en heures murales `HH:MM`, bornes incluses. */
export interface TimeRange {
  start: string;
  end: string;
}

const QUARTER = 15;
const DAY_END_MINUTES = 24 * 60;

export function toMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function toHHMM(minutes: number): string {
  const clamped = Math.max(0, Math.min(DAY_END_MINUTES, minutes));
  const hours = Math.floor(clamped / 60);
  const rest = clamped % 60;
  return `${String(hours).padStart(2, '0')}:${String(rest).padStart(2, '0')}`;
}

/**
 * Bornes du slider horaire : minimum et maximum des séances fournies, arrondis
 * vers l'extérieur au quart d'heure pour que les crans tombent juste. Rend
 * `null` quand il n'y a aucune séance — il n'y a alors rien à filtrer.
 */
export function computeTimeBounds(films: FilmListItem[]): TimeRange | null {
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;

  for (const film of films) {
    for (const showtime of film.showtimes) {
      const minutes = toMinutes(showtime.time);
      if (minutes < min) min = minutes;
      if (minutes > max) max = minutes;
    }
  }

  if (min === Number.POSITIVE_INFINITY) return null;

  const start = Math.floor(min / QUARTER) * QUARTER;
  let end = Math.ceil(max / QUARTER) * QUARTER;
  // Séance unique tombant pile sur un quart d'heure : sans cet écart le slider
  // aurait min === max et deviendrait impossible à manipuler.
  if (end === start) end += QUARTER;

  return { start: toHHMM(start), end: toHHMM(end) };
}

export function isInTimeRange(time: string, range: TimeRange): boolean {
  return time >= range.start && time <= range.end;
}

/** `18:00` → `18h00`, `24:00` → `minuit`. */
export function formatTimeLabel(time: string): string {
  if (time === '24:00') return 'minuit';
  const [hours, minutes] = time.split(':');
  return `${Number(hours)}h${minutes}`;
}
