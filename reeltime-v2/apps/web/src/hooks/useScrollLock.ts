import { useEffect } from 'react';

// Compteur au niveau module : une feuille de sélection ouverte par-dessus la
// feuille de filtres ne doit pas libérer le verrou en se refermant.
let lockCount = 0;
let savedY = 0;

function lock(): void {
  if (lockCount++ > 0) return;
  savedY = window.scrollY;
  const { style } = document.body;
  style.position = 'fixed';
  style.top = `-${savedY}px`;
  style.left = '0';
  style.right = '0';
  style.width = '100%';
}

function unlock(): void {
  if (--lockCount > 0) return;
  lockCount = 0;
  const { style } = document.body;
  style.position = '';
  style.top = '';
  style.left = '';
  style.right = '';
  style.width = '';
  window.scrollTo(0, savedY);
}

/**
 * Bloque le scroll de la page en préservant sa position. `overflow: hidden`
 * seul fait remonter la page en haut sur iOS à la libération.
 */
export function useScrollLock(active: boolean): void {
  useEffect(() => {
    if (!active) return;
    lock();
    return unlock;
  }, [active]);
}
