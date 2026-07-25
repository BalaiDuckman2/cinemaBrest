import { describe, it, expect } from 'vitest';
import { mergeFilmPages } from '../utils/mergeFilms';
import type { FilmsData } from '../api/filmsApi';
import type { FilmListItem, ShowtimeEntry } from '../types/components';

function showtime(filmId: string, date: string, time: string, cinemaId = 'P0153'): ShowtimeEntry {
  return {
    id: `${filmId}-${cinemaId}-${date}-${time}`,
    filmId,
    cinemaId,
    cinemaName: 'Les Studios',
    datetime: `${date}T${time}:00`,
    time,
    version: 'VF',
    bookingUrl: null,
  };
}

function film(id: string, title: string, showtimes: ShowtimeEntry[]): FilmListItem {
  return {
    id,
    title,
    year: 2026,
    posterUrl: null,
    rating: null,
    letterboxdRating: null,
    filmAge: null,
    synopsis: null,
    director: null,
    cast: [],
    genres: [],
    runtime: 120,
    letterboxdUrl: null,
    showtimes,
  };
}

function page(weekOffset: number, films: FilmListItem[]): FilmsData {
  return {
    films,
    meta: { weekStart: '2026-07-20', weekEnd: '2026-07-26', weekOffset, totalFilms: films.length },
  };
}

describe('mergeFilmPages', () => {
  it('unionne les séances d un film présent dans deux pages', () => {
    const a = page(0, [film('1', 'Dune', [showtime('1', '2026-07-25', '14:10')])]);
    const b = page(1, [film('1', 'Dune', [showtime('1', '2026-07-28', '20:00')])]);

    const result = mergeFilmPages([a, b], '2026-07-25', '2026-08-02');

    expect(result).toHaveLength(1);
    expect(result[0].showtimes).toHaveLength(2);
  });

  it('ne duplique pas une séance présente dans les deux pages', () => {
    const st = showtime('1', '2026-07-26', '18:00');
    const a = page(0, [film('1', 'Dune', [st])]);
    const b = page(1, [film('1', 'Dune', [{ ...st }])]);

    const result = mergeFilmPages([a, b], '2026-07-25', '2026-08-02');

    expect(result[0].showtimes).toHaveLength(1);
  });

  it('rogne les séances hors de la fenêtre', () => {
    const a = page(0, [
      film('1', 'Dune', [
        showtime('1', '2026-07-20', '14:00'), // avant la fenêtre
        showtime('1', '2026-07-25', '18:00'), // dedans
        showtime('1', '2026-08-05', '21:00'), // après
      ]),
    ]);

    const result = mergeFilmPages([a], '2026-07-25', '2026-08-02');

    expect(result[0].showtimes.map((s) => s.time)).toEqual(['18:00']);
  });

  it('écarte un film qui n a plus aucune séance dans la fenêtre', () => {
    const a = page(0, [film('1', 'Dune', [showtime('1', '2026-07-20', '14:00')])]);

    expect(mergeFilmPages([a], '2026-07-25', '2026-08-02')).toEqual([]);
  });

  it('trie les séances chronologiquement', () => {
    const a = page(0, [film('1', 'Dune', [showtime('1', '2026-07-28', '20:00')])]);
    const b = page(1, [film('1', 'Dune', [showtime('1', '2026-07-25', '14:10')])]);

    const result = mergeFilmPages([a, b], '2026-07-25', '2026-08-02');

    expect(result[0].showtimes.map((s) => s.datetime)).toEqual([
      '2026-07-25T14:10:00',
      '2026-07-28T20:00:00',
    ]);
  });

  it('conserve les métadonnées de la première page qui contient le film', () => {
    const a = page(0, [film('1', 'Titre de reference', [showtime('1', '2026-07-25', '14:10')])]);
    const b = page(1, [film('1', 'Titre concurrent', [showtime('1', '2026-07-28', '20:00')])]);

    expect(mergeFilmPages([a, b], '2026-07-25', '2026-08-02')[0].title).toBe('Titre de reference');
  });

  it('ne modifie pas les pages reçues', () => {
    const original = showtime('1', '2026-07-25', '14:10');
    const a = page(0, [film('1', 'Dune', [original])]);
    const b = page(1, [film('1', 'Dune', [showtime('1', '2026-07-28', '20:00')])]);

    mergeFilmPages([a, b], '2026-07-25', '2026-08-02');

    expect(a.films[0].showtimes).toHaveLength(1);
  });

  it('accepte une liste de pages vide', () => {
    expect(mergeFilmPages([], '2026-07-25', '2026-08-02')).toEqual([]);
  });
});
