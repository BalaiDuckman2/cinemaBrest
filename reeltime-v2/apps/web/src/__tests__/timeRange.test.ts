import { describe, it, expect } from 'vitest';
import {
  toMinutes,
  toHHMM,
  computeTimeBounds,
  isInTimeRange,
  formatTimeLabel,
} from '../utils/timeRange';
import type { FilmListItem } from '../types/components';

function filmAt(...times: string[]): FilmListItem {
  return {
    id: 1,
    title: 'Film',
    year: 2026,
    posterUrl: null,
    director: null,
    genres: [],
    filmAge: 0,
    rating: null,
    letterboxdRating: null,
    runtime: null,
    totalShowtimes: times.length,
    letterboxdUrl: '',
    showtimes: times.map((time) => ({
      date: '2026-08-04',
      time,
      version: 'VF',
      cinemaId: 'P0153',
      cinemaName: 'Les Studios',
      datetime: `2026-08-04T${time}:00`,
      bookingUrl: null,
    })),
  } as unknown as FilmListItem;
}

describe('toMinutes / toHHMM', () => {
  it('convertit dans les deux sens', () => {
    expect(toMinutes('20:40')).toBe(1240);
    expect(toHHMM(1240)).toBe('20:40');
  });

  it('zero-padde les heures du matin', () => {
    expect(toHHMM(545)).toBe('09:05');
  });
});

describe('computeTimeBounds', () => {
  it('arrondit les bornes vers l exterieur au quart d heure', () => {
    expect(computeTimeBounds([filmAt('13:50', '22:40')])).toEqual({
      start: '13:45',
      end: '22:45',
    });
  });

  it('balaie tous les films et toutes les seances', () => {
    expect(computeTimeBounds([filmAt('18:00'), filmAt('11:10', '20:00')])).toEqual({
      start: '11:00',
      end: '20:00',
    });
  });

  it('rend null quand aucune seance n existe', () => {
    expect(computeTimeBounds([])).toBeNull();
    expect(computeTimeBounds([filmAt()])).toBeNull();
  });

  it('ecarte les bornes d un quart d heure quand elles se confondent', () => {
    // Une seule séance pile sur un quart d'heure : sans écart, le slider aurait
    // min === max et Radix ne pourrait plus être manipulé.
    expect(computeTimeBounds([filmAt('20:45')])).toEqual({
      start: '20:45',
      end: '21:00',
    });
  });

  it('gere une seance de fin de soiree', () => {
    expect(computeTimeBounds([filmAt('23:50')])).toEqual({
      start: '23:45',
      end: '24:00',
    });
  });
});

describe('isInTimeRange', () => {
  const range = { start: '18:00', end: '22:45' };

  it('inclut les deux bornes', () => {
    expect(isInTimeRange('18:00', range)).toBe(true);
    expect(isInTimeRange('22:45', range)).toBe(true);
  });

  it('exclut ce qui deborde', () => {
    expect(isInTimeRange('17:59', range)).toBe(false);
    expect(isInTimeRange('22:46', range)).toBe(false);
  });

  it('ne retire rien quand la plage egale les bornes calculees', () => {
    const films = [filmAt('13:50', '18:30', '22:40')];
    const bounds = computeTimeBounds(films)!;
    const kept = films[0].showtimes.filter((st) => isInTimeRange(st.time, bounds));
    expect(kept).toHaveLength(3);
  });
});

describe('formatTimeLabel', () => {
  it('formate a la francaise', () => {
    expect(formatTimeLabel('18:00')).toBe('18h00');
    expect(formatTimeLabel('09:05')).toBe('9h05');
  });

  it('nomme minuit plutot que 24h00', () => {
    expect(formatTimeLabel('24:00')).toBe('minuit');
  });
});
