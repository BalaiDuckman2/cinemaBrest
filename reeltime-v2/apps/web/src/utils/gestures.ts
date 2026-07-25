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
