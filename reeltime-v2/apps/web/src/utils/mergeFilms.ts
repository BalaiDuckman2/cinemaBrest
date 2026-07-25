import type { FilmsData } from '../api/filmsApi';
import type { FilmListItem } from '../types/components';

/**
 * Fusionne plusieurs semaines de résultats en un seul catalogue rogné sur
 * [from, to]. Les métadonnées d'un film viennent de la première page qui le
 * contient ; seules les séances sont unionnées, dédoublonnées par `id`.
 * Les pages reçues ne sont jamais modifiées.
 */
export function mergeFilmPages(pages: FilmsData[], from: string, to: string): FilmListItem[] {
  const byId = new Map<string, FilmListItem>();

  for (const page of pages) {
    for (const film of page.films) {
      const existing = byId.get(film.id);
      if (!existing) {
        byId.set(film.id, { ...film, showtimes: [...film.showtimes] });
        continue;
      }
      const seen = new Set(existing.showtimes.map((st) => st.id));
      for (const st of film.showtimes) {
        if (!seen.has(st.id)) existing.showtimes.push(st);
      }
    }
  }

  const out: FilmListItem[] = [];
  for (const film of byId.values()) {
    const showtimes = film.showtimes
      .filter((st) => {
        const date = st.datetime.slice(0, 10);
        return date >= from && date <= to;
      })
      .sort((a, b) => a.datetime.localeCompare(b.datetime));
    if (showtimes.length > 0) out.push({ ...film, showtimes });
  }
  return out;
}
