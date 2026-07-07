import type { FilmListItem, ShowtimeEntry } from '../types/components';

/** Assumed runtime when AlloCiné doesn't provide one (flagged "~" in the UI). */
export const DEFAULT_RUNTIME_MIN = 120;
/** Ads + trailers before the feature actually starts. */
export const TRAILER_BUFFER_MIN = 15;
/** Maximum wait between two films. */
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
}

/** Showtimes of other films, same day and same city, watchable before/after the anchor showtime. */
export function findChainable({ films, anchorFilm, anchor, direction, cityOf }: FindChainableOptions): ChainCandidate[] {
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

      if (gapMin < -OVERLAP_TOLERANCE_MIN || gapMin > MAX_GAP_MIN) continue;

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

export interface EveningCombo {
  first: { film: FilmListItem; showtime: ShowtimeEntry };
  second: { film: FilmListItem; showtime: ShowtimeEntry };
  gapMin: number;
  sameCinema: boolean;
  approx: boolean;
}

interface BuildCombosOptions {
  films: FilmListItem[];
  date: string;
  city: string;
  cityOf: (cinemaId: string) => string | undefined;
  /** Earliest acceptable start for the first film, minutes since midnight (null = any). */
  minStartMin: number | null;
}

/** All pairs of chainable showtimes for a given day and city. */
export function buildEveningCombos({ films, date, city, cityOf, minStartMin }: BuildCombosOptions): EveningCombo[] {
  interface Slot { film: FilmListItem; showtime: ShowtimeEntry; start: number; end: number }

  const slots: Slot[] = [];
  for (const film of films) {
    for (const st of film.showtimes) {
      if (st.datetime.slice(0, 10) !== date) continue;
      if (cityOf(st.cinemaId) !== city) continue;
      const start = toMinutes(st.time);
      slots.push({ film, showtime: st, start, end: estimatedEnd(start, film.runtime) });
    }
  }

  const combos: EveningCombo[] = [];
  for (const first of slots) {
    if (minStartMin != null && first.start < minStartMin) continue;
    for (const second of slots) {
      if (second.film.id === first.film.id) continue;
      const gapMin = second.start - first.end;
      if (gapMin < -OVERLAP_TOLERANCE_MIN || gapMin > MAX_GAP_MIN) continue;
      combos.push({
        first: { film: first.film, showtime: first.showtime },
        second: { film: second.film, showtime: second.showtime },
        gapMin,
        sameCinema: first.showtime.cinemaId === second.showtime.cinemaId,
        approx: first.film.runtime == null,
      });
    }
  }

  combos.sort((a, b) => {
    const startDiff = toMinutes(a.first.showtime.time) - toMinutes(b.first.showtime.time);
    if (startDiff !== 0) return startDiff;
    return Math.abs(a.gapMin) - Math.abs(b.gapMin);
  });

  return combos;
}

/** "battement 20 min" / "enchaînement direct" / "chevauche de 5 min" */
export function formatGap(gapMin: number): string {
  if (gapMin > 5) return `${gapMin} min de battement`;
  if (gapMin >= -2) return 'enchaînement direct';
  return `chevauche de ${Math.abs(gapMin)} min`;
}
