import { describe, it, expect } from 'vitest';
import {
  filterCandidates,
  matchesCinemas,
  matchesVersion,
  sortCandidates,
} from '../utils/soireeFilters';
import type { ChainCandidate } from '../utils/chaining';
import type { FilmListItem, ShowtimeEntry } from '../types/components';

function candidate(
  id: string,
  time: string,
  cinemaId: string,
  cinemaName: string,
  version: ShowtimeEntry['version'],
  letterboxdRating: number | null,
  slackMin: number,
  sameCinema: boolean,
): ChainCandidate {
  const showtime: ShowtimeEntry = {
    id,
    filmId: `film-${id}`,
    cinemaId,
    cinemaName,
    datetime: `2026-08-14T${time}:00`,
    time,
    version,
    bookingUrl: null,
  };
  const film = {
    id: `film-${id}`,
    title: `Film ${id}`,
    year: 2026,
    posterUrl: null,
    rating: null,
    letterboxdRating,
    filmAge: null,
    synopsis: null,
    director: null,
    cast: [],
    genres: [],
    runtime: 100,
    letterboxdUrl: null,
    showtimes: [showtime],
  } satisfies FilmListItem;
  return { film, showtime, gapMin: slackMin, travelMin: 0, slackMin, sameCinema, approx: false };
}

const VF_CELTIC = candidate('a', '20:00', 'celtic', 'CGR Le Celtic', 'VF', 3.5, 30, true);
const VOST_STUDIOS = candidate('b', '19:00', 'studios', 'Les Studios', 'VOST', 4.2, 10, false);
const VO_LIBERTE = candidate('c', '21:00', 'liberte', 'Multiplexe Liberté', 'VO', null, 20, false);

const ALL = [VF_CELTIC, VOST_STUDIOS, VO_LIBERTE];
const NO_FILTER = { version: 'all' as const, cinemas: [], sameCinemaOnly: false };

describe('matchesVersion', () => {
  it('laisse tout passer sans filtre', () => {
    expect(matchesVersion('VF', 'all')).toBe(true);
    expect(matchesVersion('VOST', 'all')).toBe(true);
  });

  it('ne retient que la VF', () => {
    expect(matchesVersion('VF', 'VF')).toBe(true);
    expect(matchesVersion('VO', 'VF')).toBe(false);
    expect(matchesVersion('VOST', 'VF')).toBe(false);
  });

  // Même convention que le filtre de l'affiche (useFilteredFilms) : « VO »
  // englobe les séances sous-titrées.
  it('retient VO et VOST sous le filtre VO', () => {
    expect(matchesVersion('VO', 'VO')).toBe(true);
    expect(matchesVersion('VOST', 'VO')).toBe(true);
    expect(matchesVersion('VF', 'VO')).toBe(false);
  });
});

describe('matchesCinemas', () => {
  it('traite la liste vide comme « tous les cinémas »', () => {
    expect(matchesCinemas('celtic', [])).toBe(true);
  });

  it('retient les cinémas listés et écarte les autres', () => {
    expect(matchesCinemas('celtic', ['celtic', 'studios'])).toBe(true);
    expect(matchesCinemas('liberte', ['celtic', 'studios'])).toBe(false);
  });
});

describe('filterCandidates', () => {
  it('ne retire rien sans filtre', () => {
    expect(filterCandidates(ALL, NO_FILTER)).toHaveLength(3);
  });

  it('filtre sur la version', () => {
    expect(filterCandidates(ALL, { ...NO_FILTER, version: 'VO' })).toEqual([
      VOST_STUDIOS,
      VO_LIBERTE,
    ]);
    expect(filterCandidates(ALL, { ...NO_FILTER, version: 'VF' })).toEqual([VF_CELTIC]);
  });

  it('filtre sur les cinémas', () => {
    expect(filterCandidates(ALL, { ...NO_FILTER, cinemas: ['studios'] })).toEqual([VOST_STUDIOS]);
  });

  it('ne retient que le cinéma de l ancre quand « même cinéma » est actif', () => {
    expect(filterCandidates(ALL, { ...NO_FILTER, sameCinemaOnly: true })).toEqual([VF_CELTIC]);
  });

  it('combine les filtres', () => {
    expect(
      filterCandidates(ALL, { version: 'VO', cinemas: ['liberte'], sameCinemaOnly: false }),
    ).toEqual([VO_LIBERTE]);
  });
});

describe('sortCandidates', () => {
  it('préserve l ordre de findChainable pour « meilleur enchaînement »', () => {
    expect(sortCandidates(ALL, 'chain')).toEqual(ALL);
  });

  it('trie par heure de début croissante', () => {
    expect(sortCandidates(ALL, 'time').map((c) => c.showtime.time)).toEqual([
      '19:00',
      '20:00',
      '21:00',
    ]);
  });

  it('trie par note décroissante, les films sans note en dernier', () => {
    expect(sortCandidates(ALL, 'rating').map((c) => c.film.letterboxdRating)).toEqual([
      4.2,
      3.5,
      null,
    ]);
  });

  it('trie par cinéma A→Z puis par heure', () => {
    expect(sortCandidates(ALL, 'cinema').map((c) => c.showtime.cinemaName)).toEqual([
      'CGR Le Celtic',
      'Les Studios',
      'Multiplexe Liberté',
    ]);
  });

  it('ne mute pas le tableau reçu', () => {
    const input = [...ALL];
    sortCandidates(input, 'time');
    expect(input).toEqual(ALL);
  });
});
