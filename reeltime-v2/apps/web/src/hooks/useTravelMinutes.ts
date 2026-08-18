import { useCallback, useMemo } from 'react';
import { useCinemas } from './useCinemas';
import { travelMinutes, type TravelCinema } from '../utils/travel';

/**
 * Trajet entre deux salles depuis leurs identifiants. `0` pour un identifiant
 * inconnu : une salle absente du référentiel ne doit pas faire disparaître ses
 * séances des suggestions.
 */
export function useTravelMinutes(): (fromCinemaId: string, toCinemaId: string) => number {
  const { data: cinemas = [] } = useCinemas();

  const byId = useMemo(() => {
    const map = new Map<string, TravelCinema>();
    for (const c of cinemas) {
      map.set(c.id, { id: c.id, latitude: c.latitude, longitude: c.longitude });
    }
    return map;
  }, [cinemas]);

  return useCallback(
    (fromCinemaId: string, toCinemaId: string) => {
      const from = byId.get(fromCinemaId);
      const to = byId.get(toCinemaId);
      if (!from || !to) return 0;
      return travelMinutes(from, to);
    },
    [byId],
  );
}
