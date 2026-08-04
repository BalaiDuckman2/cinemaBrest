/**
 * Identifiants des cinémas d'une ville. Rend `null` — et non un tableau vide —
 * quand aucune ville n'est choisie : l'absence de filtre et « aucun cinéma ne
 * correspond » ne doivent pas se confondre côté appelant.
 */
export function cinemaIdsForCity(
  cinemas: { id: string; city: string }[],
  city: string | null,
): string[] | null {
  if (!city) return null;
  return cinemas.filter((cinema) => cinema.city === city).map((cinema) => cinema.id);
}
