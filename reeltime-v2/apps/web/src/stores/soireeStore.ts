import { create } from 'zustand';
import { persist } from 'zustand/middleware';
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

/** Ancien format persisté (version 0) : un seul plan. */
interface SoireeStateV0 {
  date: string | null;
  items: SoireeItem[];
}

interface SoireeState {
  /** clé = date "YYYY-MM-DD", valeur = séances triées chrono. Soirée vide = clé supprimée. */
  soirees: Record<string, SoireeItem[]>;
  /** Date affichée dans la barre. Transitoire (hors partialize). */
  activeDate: string | null;
  add: (item: SoireeItem) => void;
  remove: (date: string, showtimeId: string) => void;
  clearDate: (date: string) => void;
  setActiveDate: (date: string | null) => void;
  purgeExpired: (today: string) => void;
}

function sortChrono(items: SoireeItem[]): SoireeItem[] {
  return [...items].sort((a, b) => a.time.localeCompare(b.time));
}

export const useSoireeStore = create<SoireeState>()(
  persist(
    (set) => ({
      soirees: {},
      activeDate: null,
      add: (item) =>
        set((state) => {
          const existing = state.soirees[item.date] ?? [];
          if (existing.some((i) => i.showtimeId === item.showtimeId)) {
            return { activeDate: item.date };
          }
          return {
            soirees: { ...state.soirees, [item.date]: sortChrono([...existing, item]) },
            activeDate: item.date,
          };
        }),
      remove: (date, showtimeId) =>
        set((state) => {
          const items = (state.soirees[date] ?? []).filter((i) => i.showtimeId !== showtimeId);
          const soirees = { ...state.soirees };
          if (items.length > 0) soirees[date] = items;
          else delete soirees[date];
          return { soirees };
        }),
      clearDate: (date) =>
        set((state) => {
          const soirees = { ...state.soirees };
          delete soirees[date];
          return { soirees };
        }),
      setActiveDate: (activeDate) => set({ activeDate }),
      purgeExpired: (today) =>
        set((state) => ({
          soirees: Object.fromEntries(
            Object.entries(state.soirees).filter(([date]) => date >= today),
          ),
        })),
    }),
    {
      name: 'reeltime-soiree',
      version: 1,
      partialize: (state) => ({ soirees: state.soirees }),
      migrate: (persisted, version) => {
        if (version === 0) {
          const old = persisted as Partial<SoireeStateV0> | undefined;
          if (old?.date && old.items && old.items.length > 0) {
            return { soirees: { [old.date]: old.items } };
          }
          return { soirees: {} };
        }
        return persisted as { soirees: Record<string, SoireeItem[]> };
      },
    },
  ),
);

/** Prochaine soirée à venir = plus petite date présente (les passées sont purgées au montage). */
export function nextSoireeDate(soirees: Record<string, SoireeItem[]>): string | null {
  const dates = Object.keys(soirees).sort();
  return dates[0] ?? null;
}

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

/** Ajout direct : la séance rejoint la soirée de sa date (créée au besoin), sans confirmation. */
export function addToSoiree(item: SoireeItem): void {
  useSoireeStore.getState().add(item);
}
