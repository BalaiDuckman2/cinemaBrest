import { BottomSheet } from '../ui/BottomSheet';
import { FilterControls } from './FilterControls';
import { useFiltersStore } from '../../stores/filtersStore';
import type { TimeRange } from '../../utils/timeRange';

interface FilterSheetProps {
  open: boolean;
  onClose: () => void;
  cinemas: { id: string; name: string; city: string }[];
  timeBounds: TimeRange | null;
}

export function FilterSheet({ open, onClose, cinemas, timeBounds }: FilterSheetProps) {
  const resetAll = useFiltersStore((s) => s.resetAll);

  return (
    <BottomSheet open={open} onClose={onClose} label="Filtres">
      <div className="px-4 pb-8">
        <div className="flex items-center justify-between py-3">
          <h3 className="font-bebas text-rouge-cinema text-lg uppercase tracking-wider">Filtres</h3>
          <button
            type="button"
            onClick={resetAll}
            className="font-bebas min-h-[44px] px-3 text-sm text-sepia-chaud hover:text-rouge-cinema uppercase tracking-wide transition-colors"
          >
            Tout effacer
          </button>
        </div>
        <FilterControls cinemas={cinemas} timeBounds={timeBounds} />
      </div>
    </BottomSheet>
  );
}
