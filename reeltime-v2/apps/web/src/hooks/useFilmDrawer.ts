import { useState, useCallback, useEffect, useRef } from 'react';
import type { FilmListItem } from '../types/components';

interface UseFilmDrawerReturn {
  isOpen: boolean;
  selectedFilm: FilmListItem | null;
  openDrawer: (film: FilmListItem) => void;
  closeDrawer: () => void;
}

export function useFilmDrawer(): UseFilmDrawerReturn {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFilm, setSelectedFilm] = useState<FilmListItem | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  const openDrawer = useCallback((film: FilmListItem) => {
    triggerRef.current = document.activeElement as HTMLElement | null;
    setSelectedFilm(film);
    setIsOpen(true);
    document.body.classList.add('overflow-hidden');
  }, []);

  const closeDrawer = useCallback(() => {
    setIsOpen(false);
    document.body.classList.remove('overflow-hidden');
    // Return focus to the element that triggered the drawer
    setTimeout(() => {
      triggerRef.current?.focus();
      triggerRef.current = null;
      setSelectedFilm(null);
    }, 250);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeDrawer();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeDrawer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, []);

  return { isOpen, selectedFilm, openDrawer, closeDrawer };
}
