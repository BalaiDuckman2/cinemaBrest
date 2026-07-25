import { describe, it, expect } from 'vitest';
import { dragVelocity, shouldDismiss, type DragSample } from '../utils/gestures';

/** Échantillons régulièrement espacés de `step` px toutes les 16 ms. */
function samples(step: number, count = 4): DragSample[] {
  return Array.from({ length: count }, (_, i) => ({ y: i * step, t: i * 16 }));
}

describe('dragVelocity', () => {
  it('renvoie 0 sans assez d échantillons', () => {
    expect(dragVelocity([])).toBe(0);
    expect(dragVelocity([{ y: 0, t: 0 }])).toBe(0);
  });

  it('renvoie 0 quand le temps ne progresse pas', () => {
    expect(dragVelocity([{ y: 0, t: 5 }, { y: 40, t: 5 }])).toBe(0);
  });

  it('mesure une vélocité descendante positive', () => {
    // 16 px toutes les 16 ms sur les 3 derniers points = 1 px/ms.
    expect(dragVelocity(samples(16))).toBeCloseTo(1, 5);
  });

  it('mesure une vélocité montante négative', () => {
    expect(dragVelocity(samples(-16))).toBeCloseTo(-1, 5);
  });

  it('ne regarde que les trois derniers échantillons', () => {
    const mixed: DragSample[] = [
      { y: 0, t: 0 },
      { y: 500, t: 16 }, // pic ancien, doit être ignoré
      { y: 510, t: 32 },
      { y: 520, t: 48 },
    ];
    expect(dragVelocity(mixed)).toBeCloseTo((520 - 500) / 32, 5);
  });
});

describe('shouldDismiss', () => {
  it('ferme au-delà du seuil de distance, même lentement', () => {
    expect(shouldDismiss(150, samples(1))).toBe(true);
  });

  it('ferme sur un lancer rapide malgré une courte distance', () => {
    expect(shouldDismiss(60, samples(16))).toBe(true);
  });

  it('ne ferme pas sur un geste court et lent', () => {
    expect(shouldDismiss(60, samples(1))).toBe(false);
  });

  it('ne ferme jamais sur un geste vers le haut', () => {
    expect(shouldDismiss(-150, samples(-16))).toBe(false);
    expect(shouldDismiss(0, samples(16))).toBe(false);
  });
});
