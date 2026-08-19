export interface DragSample {
  /** Position verticale du doigt, en px. */
  y: number;
  /** Horodatage de l'événement, en ms. */
  t: number;
}

/** Distance au-delà de laquelle un glissement ferme, quelle que soit la vitesse. */
export const DISMISS_DISTANCE_PX = 100;
/** Vitesse au-delà de laquelle un glissement ferme, quelle que soit la distance. */
export const DISMISS_VELOCITY_PX_PER_MS = 0.5;

/**
 * Vélocité verticale en px/ms sur les trois derniers échantillons, positive
 * vers le bas. 0 si elle est indéterminable.
 */
export function dragVelocity(samples: DragSample[]): number {
  if (samples.length < 2) return 0;
  const last = samples[samples.length - 1];
  const first = samples[Math.max(0, samples.length - 3)];
  const dt = last.t - first.t;
  if (dt <= 0) return 0;
  return (last.y - first.y) / dt;
}

/**
 * Un glissement vers le bas ferme s'il dépasse le seuil de distance OU s'il est
 * lancé assez vite. Sans le second critère, un coup sec et court ne ferme pas,
 * ce qui donne l'impression que la feuille résiste.
 */
export function shouldDismiss(deltaY: number, samples: DragSample[]): boolean {
  if (deltaY <= 0) return false;
  return deltaY > DISMISS_DISTANCE_PX || dragVelocity(samples) > DISMISS_VELOCITY_PX_PER_MS;
}

/**
 * Contrôles qui gèrent eux-mêmes le glissement du doigt. Une feuille qui écoute
 * les touches sur toute sa surface doit leur laisser le geste : sans ça, régler
 * un slider la fait glisser sous le doigt, puis la ferme au relâchement, dont
 * la petite impulsion vers le bas franchit le seuil de vélocité.
 *
 * `data-drag-owner` est l'échappatoire pour un contrôle maison qui n'expose ni
 * `role="slider"` ni `input[type="range"]`.
 */
export const DRAG_OWNER_SELECTOR = '[role="slider"], input[type="range"], [data-drag-owner]';

/** Forme minimale attendue d'une cible d'événement, pour rester testable sans DOM. */
interface ClosestTarget {
  closest(selector: string): unknown;
}

/**
 * La cible appartient-elle à un contrôle qui possède déjà le geste ?
 * `document` et `window` remontent dans les événements tactiles sans porter
 * `closest` : ils comptent comme des cibles ordinaires.
 */
export function ownsDragGesture(target: unknown): boolean {
  const el = target as ClosestTarget | null | undefined;
  if (el == null || typeof el.closest !== 'function') return false;
  return el.closest(DRAG_OWNER_SELECTOR) != null;
}
