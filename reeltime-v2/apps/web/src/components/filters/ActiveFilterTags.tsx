import { DEFAULT_SORT, useFiltersStore } from '../../stores/filtersStore';
import { formatTimeLabel } from '../../utils/timeRange';

interface Cinema {
  id: string;
  name: string;
  city: string;
}

const SORT_LABELS: Record<string, string> = {
  popularity: 'Popularité',
  alphabetical: 'A→Z',
  'year-desc': '+ Récent',
  'year-asc': '+ Ancien',
  showtimes: 'Nb séances',
  letterboxd: 'Letterboxd',
};

export function ActiveFilterTags({ cinemas }: { cinemas: Cinema[] }) {
  const selectedCinemas = useFiltersStore((s) => s.selectedCinemas);
  const setSelectedCinemas = useFiltersStore((s) => s.setSelectedCinemas);
  const selectedCity = useFiltersStore((s) => s.selectedCity);
  const setCity = useFiltersStore((s) => s.setCity);
  const version = useFiltersStore((s) => s.version);
  const setVersion = useFiltersStore((s) => s.setVersion);
  const sort = useFiltersStore((s) => s.sort);
  const setSort = useFiltersStore((s) => s.setSort);
  const timeRange = useFiltersStore((s) => s.timeRange);
  const setTimeRange = useFiltersStore((s) => s.setTimeRange);
  const minAge = useFiltersStore((s) => s.minAge);
  const setMinAge = useFiltersStore((s) => s.setMinAge);
  const ceSoirMode = useFiltersStore((s) => s.ceSoirMode);
  const setCeSoirMode = useFiltersStore((s) => s.setCeSoirMode);
  const resetAll = useFiltersStore((s) => s.resetAll);

  // Retirer la ville vide aussi les puces, comme le fait le sélecteur.
  const clearCity = () => {
    setCity(null);
    setSelectedCinemas([]);
  };

  const tags: { label: string; onRemove: () => void }[] = [];

  // « Ce soir » passe en premier et masque l'étiquette de créneau horaire :
  // le mode remplace ce filtre au lieu de s'y ajouter.
  if (ceSoirMode) tags.push({ label: 'Ce soir', onRemove: () => setCeSoirMode(false) });
  if (version !== null) {
    tags.push({ label: version === 'VF' ? 'VF' : 'VO/VOST', onRemove: () => setVersion(null) });
  }
  if (!ceSoirMode && timeRange !== null) {
    tags.push({
      label: `${formatTimeLabel(timeRange.start)} – ${formatTimeLabel(timeRange.end)}`,
      onRemove: () => setTimeRange(null),
    });
  }
  if (minAge !== 0) tags.push({ label: `+${minAge} ans`, onRemove: () => setMinAge(0) });
  if (selectedCity !== null) tags.push({ label: selectedCity, onRemove: clearCity });
  if (selectedCinemas.length > 0) {
    tags.push({
      label: `${selectedCinemas.length} cinéma${selectedCinemas.length > 1 ? 's' : ''}`,
      onRemove: () => setSelectedCinemas([]),
    });
  }
  if (sort !== DEFAULT_SORT) {
    tags.push({
      label: `Tri: ${SORT_LABELS[sort] ?? sort}`,
      onRemove: () => setSort(DEFAULT_SORT),
    });
  }

  if (tags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((tag) => (
        <button
          key={tag.label}
          type="button"
          onClick={tag.onRemove}
          aria-label={`Retirer le filtre ${tag.label}`}
          className="flex items-center gap-1 min-h-[32px] bg-rouge-cinema/10 border border-rouge-cinema/30 text-rouge-cinema text-[11px] font-bebas px-2.5 rounded-full hover:bg-rouge-cinema/20 transition uppercase tracking-wide"
        >
          {tag.label}
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      ))}
      <button
        type="button"
        onClick={resetAll}
        className="text-[11px] font-bebas text-sepia-chaud hover:text-rouge-cinema min-h-[32px] px-2 uppercase tracking-wide transition"
      >
        Tout effacer
      </button>
    </div>
  );
}
