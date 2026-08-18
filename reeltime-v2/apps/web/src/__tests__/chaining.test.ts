import { describe, it, expect } from 'vitest';
import {
  DEFAULT_RUNTIME_MIN,
  MAX_GAP_MIN,
  TRAILER_BUFFER_MIN,
  estimatedEnd,
  findChainable,
  formatClock,
  formatDuration,
  formatGap,
  toMinutes,
} from '../utils/chaining';
import type { FilmListItem, ShowtimeEntry } from '../types/components';

const DATE = '2026-08-14';

const CITY_OF: Record<string, string> = {
  celtic: 'Brest',
  studios: 'Brest',
  katorza: 'Quimper',
};
const cityOf = (cinemaId: string) => CITY_OF[cinemaId];

function showtime(id: string, time: string, cinemaId = 'celtic', date = DATE): ShowtimeEntry {
  return {
    id,
    filmId: `film-${id}`,
    cinemaId,
    cinemaName: cinemaId,
    datetime: `${date}T${time}:00`,
    time,
    version: 'VF',
    bookingUrl: null,
  };
}

function film(id: string, runtime: number | null, showtimes: ShowtimeEntry[]): FilmListItem {
  return {
    id,
    title: `Film ${id}`,
    year: 2026,
    posterUrl: null,
    rating: null,
    letterboxdRating: null,
    filmAge: null,
    synopsis: null,
    director: null,
    cast: [],
    genres: [],
    runtime,
    letterboxdUrl: null,
    showtimes,
  };
}

/** Ancre : 18h00, 100 min + 15 min de pub → fin estimée 19h55. */
const ANCHOR = showtime('anchor', '18:00');
const ANCHOR_FILM = film('anchor-film', 100, [ANCHOR]);

describe('toMinutes / formatClock', () => {
  it('convertit une heure en minutes depuis minuit', () => {
    expect(toMinutes('00:00')).toBe(0);
    expect(toMinutes('18:30')).toBe(1110);
  });

  it('reformate des minutes en horloge', () => {
    expect(formatClock(1110)).toBe('18h30');
    expect(formatClock(605)).toBe('10h05');
  });

  it('replie une fin de seance passe-minuit sur le jour suivant', () => {
    expect(formatClock(1500)).toBe('1h00');
  });
});

describe('estimatedEnd', () => {
  it('ajoute la duree du film et la bande-annonce', () => {
    expect(estimatedEnd(toMinutes('18:00'), 100)).toBe(toMinutes('19:55'));
  });

  it('retombe sur la duree par defaut quand elle est inconnue', () => {
    expect(estimatedEnd(0, null)).toBe(TRAILER_BUFFER_MIN + DEFAULT_RUNTIME_MIN);
  });
});

describe('formatDuration', () => {
  it('formate les battements proposes', () => {
    expect(formatDuration(30)).toBe('30 min');
    expect(formatDuration(60)).toBe('1h');
    expect(formatDuration(90)).toBe('1h30');
  });
});

describe('formatGap', () => {
  it('nomme un battement, un enchainement direct et un chevauchement', () => {
    expect(formatGap(20)).toBe('20 min de battement');
    expect(formatGap(0)).toBe('enchaînement direct');
    expect(formatGap(-5)).toBe('chevauche de 5 min');
  });
});

describe('findChainable — direction after', () => {
  const chainable = film('b', 90, [showtime('b1', '20:15')]); // 20 min apres 19h55
  const tooLate = film('c', 90, [showtime('c1', '21:30')]); // 95 min : au-dela de la limite
  const overlapping = film('d', 90, [showtime('d1', '19:50')]); // chevauche de 5 min : tolere
  const otherCity = film('e', 90, [showtime('e1', '20:15', 'katorza')]);
  const otherDay = film('f', 90, [showtime('f1', '20:15', 'celtic', '2026-08-15')]);

  const found = findChainable({
    films: [ANCHOR_FILM, chainable, tooLate, overlapping, otherCity, otherDay],
    anchorFilm: ANCHOR_FILM,
    anchor: ANCHOR,
    direction: 'after',
    cityOf,
  });

  it('retient les seances qui commencent apres la fin estimee', () => {
    expect(found.map((c) => c.showtime.id)).toContain('b1');
    expect(found.find((c) => c.showtime.id === 'b1')?.gapMin).toBe(20);
  });

  it('tolere un chevauchement court', () => {
    expect(found.find((c) => c.showtime.id === 'd1')?.gapMin).toBe(-5);
  });

  it('ecarte au-dela du battement maximal, une autre ville, un autre jour, le film ancre', () => {
    const ids = found.map((c) => c.showtime.id);
    expect(ids).not.toContain('c1');
    expect(ids).not.toContain('e1');
    expect(ids).not.toContain('f1');
    expect(ids).not.toContain('anchor');
  });
});

describe('findChainable — direction before', () => {
  it('retient une seance qui se termine juste avant l ancre', () => {
    // 15h40 + 15 min de pub + 120 min = fin 17h55, soit 5 min avant 18h00.
    const earlier = film('g', 120, [showtime('g1', '15:40')]);
    const found = findChainable({
      films: [ANCHOR_FILM, earlier],
      anchorFilm: ANCHOR_FILM,
      anchor: ANCHOR,
      direction: 'before',
      cityOf,
    });
    expect(found).toHaveLength(1);
    expect(found[0].gapMin).toBe(5);
  });

  it('signale une duree estimee quand le film candidat n a pas de duree', () => {
    const unknown = film('h', null, [showtime('h1', '15:45')]);
    const found = findChainable({
      films: [ANCHOR_FILM, unknown],
      anchorFilm: ANCHOR_FILM,
      anchor: ANCHOR,
      direction: 'before',
      cityOf,
    });
    expect(found[0].approx).toBe(true);
  });
});

describe('findChainable — options', () => {
  const late = film('i', 90, [showtime('i1', '21:00')]); // 65 min apres la fin estimee

  it('exclut au-dela du battement par defaut', () => {
    const found = findChainable({
      films: [ANCHOR_FILM, late],
      anchorFilm: ANCHOR_FILM,
      anchor: ANCHOR,
      direction: 'after',
      cityOf,
    });
    expect(found).toHaveLength(0);
    expect(65).toBeGreaterThan(MAX_GAP_MIN);
  });

  it('inclut la meme seance avec un battement maximal elargi', () => {
    const found = findChainable({
      films: [ANCHOR_FILM, late],
      anchorFilm: ANCHOR_FILM,
      anchor: ANCHOR,
      direction: 'after',
      cityOf,
      maxGapMin: 90,
    });
    expect(found.map((c) => c.showtime.id)).toEqual(['i1']);
  });

  it('ecarte les seances deja commencees quand notBefore est fourni', () => {
    const earlier = film('j', 120, [showtime('j1', '15:40')]);
    const options = {
      films: [ANCHOR_FILM, earlier],
      anchorFilm: ANCHOR_FILM,
      anchor: ANCHOR,
      direction: 'before' as const,
      cityOf,
    };
    expect(findChainable({ ...options, notBefore: '15:00' })).toHaveLength(1);
    expect(findChainable({ ...options, notBefore: '16:30' })).toHaveLength(0);
  });

  it('classe les seances du meme cinema avant les autres, puis par battement', () => {
    const sameCinemaFar = film('k', 90, [showtime('k1', '20:45')]); // meme cinema, 50 min
    const otherCinemaClose = film('l', 90, [showtime('l1', '20:00', 'studios')]); // autre cinema, 5 min
    const found = findChainable({
      films: [ANCHOR_FILM, sameCinemaFar, otherCinemaClose],
      anchorFilm: ANCHOR_FILM,
      anchor: ANCHOR,
      direction: 'after',
      cityOf,
    });
    expect(found.map((c) => c.showtime.id)).toEqual(['k1', 'l1']);
  });
});

describe('findChainable — temps de trajet', () => {
  /** Salles éloignées : une demi-heure de marche entre deux cinémas distincts. */
  const travelOf = (a: string, b: string) => (a === b ? 0 : 30);

  it('laisse gapMin brut et met slackMin à sa valeur quand aucun trajet n est injecté', () => {
    const next = showtime('n1', '20:15');
    const [candidate] = findChainable({
      films: [ANCHOR_FILM, film('f1', 90, [next])],
      anchorFilm: ANCHOR_FILM,
      anchor: ANCHOR,
      direction: 'after',
      cityOf,
    });
    expect(candidate.gapMin).toBe(20);
    expect(candidate.travelMin).toBe(0);
    expect(candidate.slackMin).toBe(20);
  });

  it('ne compte aucun trajet entre deux séances du même cinéma', () => {
    const next = showtime('n2', '20:15', 'celtic');
    const [candidate] = findChainable({
      films: [ANCHOR_FILM, film('f2', 90, [next])],
      anchorFilm: ANCHOR_FILM,
      anchor: ANCHOR,
      direction: 'after',
      cityOf,
      travelMinutesBetween: travelOf,
    });
    expect(candidate.travelMin).toBe(0);
    expect(candidate.slackMin).toBe(20);
  });

  // 20:05 laisse 10 min brutes : jouable dans la même salle, infaisable après
  // une demi-heure de marche.
  it('écarte un candidat que le trajet rend infaisable', () => {
    const next = showtime('n3', '20:05', 'studios');
    const options = {
      films: [ANCHOR_FILM, film('f3', 90, [next])],
      anchorFilm: ANCHOR_FILM,
      anchor: ANCHOR,
      direction: 'after' as const,
      cityOf,
    };
    expect(findChainable(options)).toHaveLength(1);
    expect(findChainable({ ...options, travelMinutesBetween: travelOf })).toHaveLength(0);
  });

  // Le plafond de battement borne le temps mort, pas le temps total : 1h10
  // brutes dont 30 min de marche, c'est 40 min d'attente, donc acceptable.
  it('accepte un battement brut supérieur au plafond quand le trajet en absorbe une part', () => {
    const next = showtime('n4', '21:05', 'studios');
    const options = {
      films: [ANCHOR_FILM, film('f4', 90, [next])],
      anchorFilm: ANCHOR_FILM,
      anchor: ANCHOR,
      direction: 'after' as const,
      cityOf,
      maxGapMin: 60,
    };
    expect(findChainable(options)).toHaveLength(0);
    const [candidate] = findChainable({ ...options, travelMinutesBetween: travelOf });
    expect(candidate.gapMin).toBe(70);
    expect(candidate.travelMin).toBe(30);
    expect(candidate.slackMin).toBe(40);
  });

  it('déduit aussi le trajet dans la direction « avant »', () => {
    // Film de 90 min commençant à 16:00 → fin estimée 17:45, soit 15 min avant
    // l'ancre de 18:00 ; la marche de 30 min rend l'enchaînement impossible.
    const prev = showtime('p1', '16:00', 'studios');
    const options = {
      films: [ANCHOR_FILM, film('f5', 90, [prev])],
      anchorFilm: ANCHOR_FILM,
      anchor: ANCHOR,
      direction: 'before' as const,
      cityOf,
    };
    expect(findChainable(options)).toHaveLength(1);
    expect(findChainable({ ...options, travelMinutesBetween: travelOf })).toHaveLength(0);
  });

  it('ordonne à cinéma égal sur le temps libre, pas sur le battement brut', () => {
    // Même cinéma, 20 min libres. Autre cinéma, 35 min brutes → 5 min libres.
    const proche = showtime('s1', '20:15', 'celtic');
    const loin = showtime('s2', '20:30', 'studios');
    const candidates = findChainable({
      films: [ANCHOR_FILM, film('f6', 90, [proche]), film('f7', 90, [loin])],
      anchorFilm: ANCHOR_FILM,
      anchor: ANCHOR,
      direction: 'after',
      cityOf,
      travelMinutesBetween: travelOf,
    });
    // Le même cinéma passe devant quoi qu'il arrive, mais les deux valeurs
    // doivent être calculées sur le temps libre.
    expect(candidates.map((c) => c.slackMin)).toEqual([20, 5]);
  });
});
