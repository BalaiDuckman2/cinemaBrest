import { describe, it, expect } from 'vitest';
import { haversineMeters, travelMinutes } from '../utils/travel';

const STUDIOS = { id: 'P0153', latitude: 48.3886, longitude: -4.4942 };
const CELTIC = { id: 'P0151', latitude: 48.3897, longitude: -4.4864 };
const LIBERTE = { id: 'P0417', latitude: 48.3904, longitude: -4.4861 };
const CAPUCINS = { id: 'W2920', latitude: 48.3838, longitude: -4.4977 };
const SANS_COORDS = { id: 'X0000', latitude: null, longitude: null };

describe('haversineMeters', () => {
  it('mesure environ 590 m entre Les Studios et Le Celtic', () => {
    const d = haversineMeters(STUDIOS, CELTIC);
    expect(d).not.toBeNull();
    expect(d as number).toBeGreaterThan(500);
    expect(d as number).toBeLessThan(700);
  });

  it('est symétrique', () => {
    expect(haversineMeters(STUDIOS, CELTIC)).toBeCloseTo(
      haversineMeters(CELTIC, STUDIOS) as number,
      6,
    );
  });

  it('vaut 0 entre un point et lui-même', () => {
    expect(haversineMeters(STUDIOS, STUDIOS)).toBeCloseTo(0, 6);
  });

  it('retourne null si une coordonnée manque', () => {
    expect(haversineMeters(STUDIOS, SANS_COORDS)).toBeNull();
    expect(haversineMeters(SANS_COORDS, STUDIOS)).toBeNull();
  });
});

describe('travelMinutes', () => {
  it('ne compte aucun trajet dans la même salle', () => {
    expect(travelMinutes(STUDIOS, { ...STUDIOS })).toBe(0);
  });

  it('compte 10 min entre Les Studios et Le Celtic', () => {
    expect(travelMinutes(STUDIOS, CELTIC)).toBe(10);
  });

  it('compte 20 min entre Pathé Capucins et le Multiplexe Liberté', () => {
    expect(travelMinutes(CAPUCINS, LIBERTE)).toBe(20);
  });

  // Le Celtic et Liberté sont à 80 m : l'arrondi au multiple de 5 donnerait 0,
  // or deux salles distinctes ne sont jamais à zéro minute l'une de l'autre.
  it('applique un plancher de 5 min entre deux salles distinctes très proches', () => {
    expect(travelMinutes(CELTIC, LIBERTE)).toBe(5);
  });

  it('est symétrique', () => {
    expect(travelMinutes(STUDIOS, CAPUCINS)).toBe(travelMinutes(CAPUCINS, STUDIOS));
  });

  // Mieux vaut ne rien déduire que déduire n'importe quoi : un cinéma sans
  // coordonnées ne doit pas faire disparaître ses séances des suggestions.
  it('ne compte aucun trajet si une coordonnée manque', () => {
    expect(travelMinutes(STUDIOS, SANS_COORDS)).toBe(0);
    expect(travelMinutes(SANS_COORDS, STUDIOS)).toBe(0);
  });
});
