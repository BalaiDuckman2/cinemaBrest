import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { parisWallClockToUtc } from '../utils/parisTime.js';

// AlloCiné renvoie des horaires muraux parisiens sans fuseau ("2026-08-04T20:40:00").
// Le conteneur de prod (node:20-alpine) tourne en UTC : on le simule ici, sinon le
// bug est invisible sur une machine de dev déjà à l'heure de Paris.
const originalTz = process.env.TZ;

beforeAll(() => {
  process.env.TZ = 'UTC';
});

afterAll(() => {
  process.env.TZ = originalTz;
});

function parisHHMM(instant: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Paris',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(instant);
}

describe('parisWallClockToUtc', () => {
  it("convertit un horaire d'été (Paris = UTC+2) en instant UTC", () => {
    expect(parisWallClockToUtc('2026-08-04T20:40:00').toISOString()).toBe(
      '2026-08-04T18:40:00.000Z',
    );
  });

  it("convertit un horaire d'hiver (Paris = UTC+1) en instant UTC", () => {
    expect(parisWallClockToUtc('2026-01-15T20:40:00').toISOString()).toBe(
      '2026-01-15T19:40:00.000Z',
    );
  });

  it('garde la séance le bon jour pour une séance de fin de soirée', () => {
    const instant = parisWallClockToUtc('2026-08-04T23:30:00');
    expect(instant.toISOString()).toBe('2026-08-04T21:30:00.000Z');
    expect(parisHHMM(instant)).toBe('23:30');
  });

  it('relit exactement le même horaire une fois reformaté en heure de Paris', () => {
    for (const wallClock of ['2026-08-04T20:40:00', '2026-01-15T14:15:00', '2026-03-29T04:30:00']) {
      expect(parisHHMM(parisWallClockToUtc(wallClock))).toBe(wallClock.substring(11, 16));
    }
  });

  it('respecte un horaire qui porte déjà son fuseau', () => {
    expect(parisWallClockToUtc('2026-08-04T18:40:00Z').toISOString()).toBe(
      '2026-08-04T18:40:00.000Z',
    );
    expect(parisWallClockToUtc('2026-08-04T20:40:00+02:00').toISOString()).toBe(
      '2026-08-04T18:40:00.000Z',
    );
  });

  it("produit le même instant quel que soit le fuseau du serveur", () => {
    const utcResult = parisWallClockToUtc('2026-08-04T20:40:00');
    process.env.TZ = 'America/New_York';
    const nyResult = parisWallClockToUtc('2026-08-04T20:40:00');
    process.env.TZ = 'UTC';
    expect(nyResult.getTime()).toBe(utcResult.getTime());
  });
});
