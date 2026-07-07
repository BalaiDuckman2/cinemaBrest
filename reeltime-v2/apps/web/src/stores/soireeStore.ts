import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { formatDayShort } from '../utils/dates';
import type { FilmListItem, ShowtimeEntry } from '../types/components';

/** Snapshot d'une séance : le plan reste affichable même si les données de la semaine changent. */
export interface SoireeItem {
  showtimeId: string;
  filmId: string;
  title: string;
  posterUrl: string | null;
  runtime: number | null;
  time: string;
  date: string;
  cinemaId: string;
  cinemaName: string;
  city: string;
  version: string | null;
  bookingUrl: string | null;
}

interface SoireeState {
  /** Un seul plan, une seule date (null = plan vide). */
  date: string | null;
  items: SoireeItem[];
  add: (item: SoireeItem) => void;
  remove: (showtimeId: string) => void;
  clear: () => void;
  replaceAll: (items: SoireeItem[]) => void;
  purgeExpired: (today: string) => void;
}

function sortChrono(items: SoireeItem[]): SoireeItem[] {
  return [...items].sort((a, b) => a.time.localeCompare(b.time));
}

export const useSoireeStore = create<SoireeState>()(
  persist(
    (set) => ({
      date: null,
      items: [],
      add: (item) =>
        set((state) => {
          if (state.items.some((i) => i.showtimeId === item.showtimeId)) return state;
          return { date: item.date, items: sortChrono([...state.items, item]) };
        }),
      remove: (showtimeId) =>
        set((state) => {
          const items = state.items.filter((i) => i.showtimeId !== showtimeId);
          return { items, date: items.length > 0 ? state.date : null };
        }),
      clear: () => set({ date: null, items: [] }),
      replaceAll: (items) => set({ date: items[0]?.date ?? null, items: sortChrono(items) }),
      purgeExpired: (today) =>
        set((state) => (state.date && state.date < today ? { date: null, items: [] } : state)),
    }),
    {
      name: 'reeltime-soiree',
      partialize: (state) => ({ date: state.date, items: state.items }),
    },
  ),
);

export function makeSoireeItem(
  film: Pick<FilmListItem, 'id' | 'title' | 'posterUrl' | 'runtime'>,
  st: ShowtimeEntry,
  city: string | undefined,
): SoireeItem {
  return {
    showtimeId: st.id,
    filmId: film.id,
    title: film.title,
    posterUrl: film.posterUrl,
    runtime: film.runtime,
    time: st.time,
    date: st.datetime.slice(0, 10),
    cinemaId: st.cinemaId,
    cinemaName: st.cinemaName,
    city: city ?? '',
    version: st.version ?? null,
    bookingUrl: st.bookingUrl,
  };
}

/** Ajout avec règles : dédup, confirmation si le plan est sur une autre date. */
export function addToSoiree(item: SoireeItem): void {
  const { date, items, add, replaceAll } = useSoireeStore.getState();
  if (items.some((i) => i.showtimeId === item.showtimeId)) return;
  if (date && date !== item.date) {
    if (!window.confirm(`Remplacer la soirée du ${formatDayShort(date)} ?`)) return;
    replaceAll([item]);
    return;
  }
  add(item);
}

/** « Utiliser ce combo » : remplace le plan courant ; confirmation seulement si autre date. */
export function replaceSoiree(items: SoireeItem[]): void {
  const { date, replaceAll } = useSoireeStore.getState();
  const newDate = items[0]?.date;
  if (date && newDate && date !== newDate) {
    if (!window.confirm(`Remplacer la soirée du ${formatDayShort(date)} ?`)) return;
  }
  replaceAll(items);
}
