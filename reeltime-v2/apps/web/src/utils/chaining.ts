import type { FilmListItem, ShowtimeEntry } from '../types/components';

/** Assumed runtime when AlloCiné doesn't provide one (flagged "~" in the UI). */
export const DEFAULT_RUNTIME_MIN = 120;
/** Ads + trailers before the feature actually starts. */
export const TRAILER_BUFFER_MIN = 15;
/** Default maximum wait between two films. */
export const MAX_GAP_MIN = 60;
/** Acceptable overlap (skipping end credits / start ads). */
export const OVERLAP_TOLERANCE_MIN = 10;

export function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export function formatClock(minutes: number): string {
  const clamped = ((minutes % 1440) + 1440) % 1440;
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${h}h${String(m).padStart(2, '0')}`;
}

/** Estimated end of a screening, in minutes since midnight. */
export function estimatedEnd(startMin: number, runtime: number | null): number {
  return startMin + TRAILER_BUFFER_MIN + (runtime ?? DEFAULT_RUNTIME_MIN);
}

export interface ChainCandidate {
  film: FilmListItem;
  showtime: ShowtimeEntry;
  /** Minutes between the end of the first film and the start of the next (negative = overlap). */
  gapMin: number;
  sameCinema: boolean;
  /** True when at least one runtime was unknown and estimated. */
  approx: boolean;
}

interface FindChainableOptions {
  films: FilmListItem[];
  /** Seuls id et runtime sont lus — permet d'ancrer sur un snapshot « Ma soirée ». */
  anchorFilm: Pick<FilmListItem, 'id' | 'runtime'>;
  anchor: ShowtimeEntry;
  direction: 'before' | 'after';
  cityOf: (cinemaId: string) => string | undefined;
  /** Attente maximale acceptée entre les deux séances. Défaut : `MAX_GAP_MIN`. */
  maxGapMin?: number;
  /** Heure "HH:MM" avant laquelle une séance est déjà commencée (jour courant uniquement). */
  notBefore?: string;
}

/** Showtimes of other films, same day and same city, watchable before/after the anchor showtime. */
export function findChainable({
  films,
  anchorFilm,
  anchor,
  direction,
  cityOf,
  maxGapMin = MAX_GAP_MIN,
  notBefore,
}: FindChainableOptions): ChainCandidate[] {
  const anchorDate = anchor.datetime.slice(0, 10);
  const anchorCity = cityOf(anchor.cinemaId);
  if (!anchorCity) return [];

  const anchorStart = toMinutes(anchor.time);
  const anchorEnd = estimatedEnd(anchorStart, anchorFilm.runtime);

  const candidates: ChainCandidate[] = [];

  for (const film of films) {
    if (film.id === anchorFilm.id) continue;

    for (const st of film.showtimes) {
      if (st.datetime.slice(0, 10) !== anchorDate) continue;
      if (cityOf(st.cinemaId) !== anchorCity) continue;
      // Une séance déjà commencée n'est pas enchaînable, même si l'arithmétique
      // des battements l'accepte : c'est le cas typique du « avant » proposé
      // alors qu'on planifie sa soirée en fin d'après-midi.
      if (notBefore && st.time < notBefore) continue;

      const start = toMinutes(st.time);
      let gapMin: number;
      let approx: boolean;

      if (direction === 'after') {
        gapMin = start - anchorEnd;
        approx = anchorFilm.runtime == null;
      } else {
        gapMin = anchorStart - estimatedEnd(start, film.runtime);
        approx = film.runtime == null;
      }

      if (gapMin < -OVERLAP_TOLERANCE_MIN || gapMin > maxGapMin) continue;

      candidates.push({
        film,
        showtime: st,
        gapMin,
        sameCinema: st.cinemaId === anchor.cinemaId,
        approx,
      });
    }
  }

  candidates.sort((a, b) => {
    if (a.sameCinema !== b.sameCinema) return a.sameCinema ? -1 : 1;
    return Math.abs(a.gapMin) - Math.abs(b.gapMin);
  });

  return candidates;
}

/** "45 min" / "1h" / "1h30" — pour les textes qui annoncent la limite de battement. */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, '0')}`;
}

/** "battement 20 min" / "enchaînement direct" / "chevauche de 5 min" */
export function formatGap(gapMin: number): string {
  if (gapMin > 5) return `${gapMin} min de battement`;
  if (gapMin >= -2) return 'enchaînement direct';
  return `chevauche de ${Math.abs(gapMin)} min`;
}
