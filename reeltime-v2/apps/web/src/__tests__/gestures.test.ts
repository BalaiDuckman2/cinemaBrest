import { describe, it, expect } from 'vitest';
import {
  DRAG_OWNER_SELECTOR,
  dragVelocity,
  ownsDragGesture,
  shouldDismiss,
  type DragSample,
} from '../utils/gestures';

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

describe('ownsDragGesture', () => {
  /** Élément minimal : seul `closest` compte, ce qui permet de tester sans DOM. */
  function target(match: boolean, spy?: (sel: string) => void) {
    return {
      closest(selector: string) {
        spy?.(selector);
        return match ? { tagName: 'DIV' } : null;
      },
    };
  }

  it('rend false pour une cible absente', () => {
    expect(ownsDragGesture(null)).toBe(false);
    expect(ownsDragGesture(undefined)).toBe(false);
  });

  // `document` et `window` remontent dans les événements tactiles sans porter
  // `closest` : les traiter comme des cibles ordinaires plutôt que planter.
  it('rend false pour une cible sans closest', () => {
    expect(ownsDragGesture({})).toBe(false);
  });

  it('rend true quand la cible est dans un contrôle propriétaire du geste', () => {
    expect(ownsDragGesture(target(true))).toBe(true);
  });

  it('rend false quand la cible n est dans aucun contrôle propriétaire', () => {
    expect(ownsDragGesture(target(false))).toBe(false);
  });

  it('interroge le sélecteur des contrôles propriétaires', () => {
    let asked = '';
    ownsDragGesture(target(false, (sel) => { asked = sel; }));
    expect(asked).toBe(DRAG_OWNER_SELECTOR);
  });

  // Ce sont les trois cas qui ont motivé le correctif : le slider Radix expose
  // role="slider", et data-drag-owner sert d'échappatoire pour le reste.
  it('couvre les sliders Radix, les input range et l échappatoire explicite', () => {
    expect(DRAG_OWNER_SELECTOR).toContain('[role="slider"]');
    expect(DRAG_OWNER_SELECTOR).toContain('input[type="range"]');
    expect(DRAG_OWNER_SELECTOR).toContain('[data-drag-owner]');
  });
});
