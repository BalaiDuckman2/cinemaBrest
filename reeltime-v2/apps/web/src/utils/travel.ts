/** Rayon moyen de la Terre, en mètres. */
const EARTH_RADIUS_M = 6_371_000;

/** Vitesse de marche retenue, en mètres par minute (~4,8 km/h). */
export const WALK_SPEED_M_PER_MIN = 80;

/** Les rues ne sont pas des lignes droites : majoration du vol d'oiseau. */
export const DETOUR_FACTOR = 1.3;

/** Annoncer « 7 min de trajet » serait une précision que ce calcul n'a pas. */
const ROUNDING_MIN = 5;

export interface GeoPoint {
  latitude: number | null;
  longitude: number | null;
}

export interface TravelCinema extends GeoPoint {
  id: string;
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/** Distance à vol d'oiseau. `null` dès qu'une coordonnée manque. */
export function haversineMeters(a: GeoPoint, b: GeoPoint): number | null {
  if (a.latitude == null || a.longitude == null || b.latitude == null || b.longitude == null) {
    return null;
  }
  const dLat = toRadians(b.latitude - a.latitude);
  const dLon = toRadians(b.longitude - a.longitude);
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

/**
 * Trajet à pied estimé entre deux salles, arrondi au multiple de 5 minutes.
 * `0` pour la même salle ou pour un cinéma sans coordonnées : sans données, ne
 * rien déduire vaut mieux que retrancher un forfait arbitraire.
 */
export function travelMinutes(from: TravelCinema, to: TravelCinema): number {
  if (from.id === to.id) return 0;
  const meters = haversineMeters(from, to);
  if (meters == null) return 0;
  const minutes = (meters * DETOUR_FACTOR) / WALK_SPEED_M_PER_MIN;
  const rounded = Math.round(minutes / ROUNDING_MIN) * ROUNDING_MIN;
  return Math.max(rounded, ROUNDING_MIN);
}
