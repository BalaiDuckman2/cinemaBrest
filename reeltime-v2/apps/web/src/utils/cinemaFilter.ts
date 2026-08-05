interface CinemaLike {
  city: string;
}

/**
 * Villes hors zone par défaut. Leurs cinémas ne sortent qu'à la demande : tant
 * que la ville n'est pas choisie, ils restent absents de l'affiche comme des
 * puces. Troyes est à 700 km de la Bretagne — noyer l'affiche locale sous des
 * séances qu'on ne peut pas aller voir coûterait plus que ça ne rapporte.
 */
export const OPT_IN_CITIES = ['Troyes'];

export function isOptInCity(city: string): boolean {
  return OPT_IN_CITIES.includes(city);
}

/**
 * Cinémas correspondant à la ville choisie ; sans ville, tous ceux de la zone
 * par défaut. Rendre les cinémas plutôt que leurs seuls identifiants garde une
 * source unique pour l'affiche et pour les puces du panneau de filtres.
 */
export function cinemasForCity<T extends CinemaLike>(cinemas: T[], city: string | null): T[] {
  if (city) return cinemas.filter((cinema) => cinema.city === city);
  return cinemas.filter((cinema) => !isOptInCity(cinema.city));
}

/**
 * Identifiants des cinémas retenus. Rend `null` — et non un tableau vide —
 * quand la liste des cinémas n'est pas encore chargée : « pas de filtre » et
 * « aucun cinéma ne correspond » ne doivent pas se confondre côté appelant,
 * sinon l'affiche se viderait le temps que la requête cinémas arrive.
 */
export function cinemaIdsForCity(
  cinemas: { id: string; city: string }[],
  city: string | null,
): string[] | null {
  if (cinemas.length === 0) return null;
  return cinemasForCity(cinemas, city).map((cinema) => cinema.id);
}

/**
 * Libellé de l'option « pas de ville choisie ». Il annonce les villes qu'elle
 * écarte : promettre « toutes les villes » puis cacher Troyes se lirait comme
 * un bug.
 */
export function defaultCityLabel(cities: string[]): string {
  const excluded = cities.filter(isOptInCity);
  return excluded.length > 0 ? `Toutes sauf ${excluded.join(', ')}` : 'Toutes les villes';
}
