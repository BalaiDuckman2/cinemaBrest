import { useEffect, useRef } from 'react';
import { useFiltersStore } from '../stores/filtersStore';
import type { TimeRange } from '../utils/timeRange';

/**
 * Remet la plage horaire à zéro dès que les bornes calculées changent — jour,
 * ville ou cinémas différents. Sans cela, une plage réglée hier survivrait sur
 * un jour dont les séances ne la recoupent pas, et la liste paraîtrait vide
 * sans raison visible.
 *
 * La comparaison porte sur une clé texte et non sur l'objet : `computeTimeBounds`
 * rend un objet neuf à chaque rendu, qui déclencherait l'effet en boucle.
 */
export function useTimeRangeReset(bounds: TimeRange | null): void {
  const setTimeRange = useFiltersStore((s) => s.setTimeRange);
  const previousKey = useRef<string | null>(null);
  const key = bounds ? `${bounds.start}-${bounds.end}` : '';

  useEffect(() => {
    if (previousKey.current !== null && previousKey.current !== key) {
      setTimeRange(null);
    }
    previousKey.current = key;
  }, [key, setTimeRange]);
}
