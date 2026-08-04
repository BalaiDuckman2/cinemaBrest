import { useFiltersStore } from '../../stores/filtersStore';
import type { SortOption } from '../../stores/filtersStore';
import { getCinemaShortName } from '../../utils/cinemaNames';
import type { TimeRange } from '../../utils/timeRange';
import { AgeSlider } from './AgeSlider';
import { FilterSelect } from './FilterSelect';
import { TimeRangeSlider } from './TimeRangeSlider';
import { SORT_OPTIONS, VERSION_OPTIONS } from './filterOptions';

interface Cinema {
  id: string;
  name: string;
  city: string;
}

interface FilterControlsProps {
  cinemas: Cinema[];
  timeBounds: TimeRange | null;
}

export function FilterControls({ cinemas, timeBounds }: FilterControlsProps) {
  const selectedCinemas = useFiltersStore((s) => s.selectedCinemas);
  const toggleCinema = useFiltersStore((s) => s.toggleCinema);
  const setSelectedCinemas = useFiltersStore((s) => s.setSelectedCinemas);
  const selectedCity = useFiltersStore((s) => s.selectedCity);
  const setCity = useFiltersStore((s) => s.setCity);
  const version = useFiltersStore((s) => s.version);
  const setVersion = useFiltersStore((s) => s.setVersion);
  const sort = useFiltersStore((s) => s.sort);
  const setSort = useFiltersStore((s) => s.setSort);
  const ceSoirMode = useFiltersStore((s) => s.ceSoirMode);
  const setCeSoirMode = useFiltersStore((s) => s.setCeSoirMode);
  const setSelectedDate = useFiltersStore((s) => s.setSelectedDate);

  // Les villes viennent des cinémas eux-mêmes : plus de liste à maintenir à la main.
  const cities = Array.from(new Set(cinemas.map((c) => c.city))).sort();
  const cityOptions = [
    { value: 'all', label: 'Toutes les villes' },
    ...cities.map((c) => ({ value: c, label: c })),
  ];

  const visibleCinemas = selectedCity
    ? cinemas.filter((cinema) => cinema.city === selectedCity)
    : cinemas;

  // Changer de ville vide les puces : sinon des cinémas d'une autre ville
  // resteraient cochés, invisibles à l'écran, et filtreraient en douce.
  const handleCityChange = (value: string) => {
    setCity(value === 'all' ? null : value);
    setSelectedCinemas([]);
  };

  return (
    <div className="space-y-3">
      {/* « Ce soir » : ex-bouton du bandeau haut, devenu un réglage parmi les autres. */}
      <button
        type="button"
        onClick={() => {
          if (ceSoirMode) {
            setCeSoirMode(false);
          } else {
            setSelectedDate(null);
            setCeSoirMode(true);
          }
        }}
        aria-pressed={ceSoirMode}
        className={`font-bebas flex items-center justify-between w-full min-h-[48px] px-3 rounded-lg border-2 text-sm uppercase tracking-wide transition-colors ${
          ceSoirMode
            ? 'bg-rouge-cinema border-bordeaux-profond text-creme-ecran shadow-md'
            : 'bg-creme-ecran border-sepia-chaud text-noir-velours'
        }`}
      >
        <span>🌙 Ce soir (après 18h)</span>
        <span className="text-xs">{ceSoirMode ? 'Activé' : 'Désactivé'}</span>
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
        <FilterSelect label="Tri" value={sort} options={SORT_OPTIONS} onChange={(v) => setSort(v as SortOption)} />
        <FilterSelect label="Version" value={version ?? 'all'} options={VERSION_OPTIONS} onChange={(v) => setVersion(v === 'all' ? null : (v as 'VF' | 'VO' | 'VOST'))} />
      </div>

      <TimeRangeSlider bounds={timeBounds} />

      <AgeSlider />

      <FilterSelect label="Ville" value={selectedCity ?? 'all'} options={cityOptions} onChange={handleCityChange} />

      <div className="flex flex-wrap gap-2">
        {visibleCinemas.map((cinema) => {
          const isSelected = selectedCinemas.length === 0 || selectedCinemas.includes(cinema.id);
          return (
            <label
              key={cinema.id}
              className={`ticket-chip flex items-center gap-2 min-h-[44px] px-3 border-2 rounded-full font-bebas text-[11px] text-noir-velours uppercase tracking-wide cursor-pointer ${
                isSelected ? 'bg-creme-ecran border-sepia-chaud' : 'bg-beige-papier border-sepia-chaud/50 opacity-60'
              }`}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => toggleCinema(cinema.id)}
                className="w-4 h-4 rounded accent-rouge-cinema"
              />
              {getCinemaShortName(cinema.name)}
            </label>
          );
        })}
      </div>
    </div>
  );
}
