import { useFiltersStore } from '../../stores/filtersStore';
import type { SortOption, TimeSlotFilter, MinAgeFilter } from '../../stores/filtersStore';
import { getCinemaShortName } from '../../utils/cinemaNames';
import { FilterSelect } from './FilterSelect';
import {
  DEPARTMENTS,
  MIN_AGE_OPTIONS,
  SORT_OPTIONS,
  TIME_SLOT_OPTIONS,
  VERSION_OPTIONS,
} from './filterOptions';

interface Cinema {
  id: string;
  name: string;
  city: string;
}

export function FilterControls({ cinemas }: { cinemas: Cinema[] }) {
  const selectedCinemas = useFiltersStore((s) => s.selectedCinemas);
  const toggleCinema = useFiltersStore((s) => s.toggleCinema);
  const setSelectedCinemas = useFiltersStore((s) => s.setSelectedCinemas);
  const selectedDepartment = useFiltersStore((s) => s.selectedDepartment);
  const setDepartment = useFiltersStore((s) => s.setDepartment);
  const selectedCity = useFiltersStore((s) => s.selectedCity);
  const setCity = useFiltersStore((s) => s.setCity);
  const version = useFiltersStore((s) => s.version);
  const setVersion = useFiltersStore((s) => s.setVersion);
  const sort = useFiltersStore((s) => s.sort);
  const setSort = useFiltersStore((s) => s.setSort);
  const timeSlot = useFiltersStore((s) => s.timeSlot);
  const setTimeSlot = useFiltersStore((s) => s.setTimeSlot);
  const minAge = useFiltersStore((s) => s.minAge);
  const setMinAge = useFiltersStore((s) => s.setMinAge);
  const ceSoirMode = useFiltersStore((s) => s.ceSoirMode);
  const setCeSoirMode = useFiltersStore((s) => s.setCeSoirMode);
  const setSelectedDate = useFiltersStore((s) => s.setSelectedDate);

  const availableCities = selectedDepartment
    ? DEPARTMENTS.find((d) => d.label === selectedDepartment)?.cities ?? []
    : DEPARTMENTS.flatMap((d) => d.cities);

  const visibleCinemas = cinemas.filter((cinema) => {
    if (selectedCity) return cinema.city === selectedCity;
    if (selectedDepartment) return availableCities.includes(cinema.city);
    return true;
  });

  const cityOptions = [
    { value: 'all', label: 'Toutes villes' },
    ...availableCities.map((c) => ({ value: c, label: c })),
  ];
  const departmentOptions = [
    { value: 'all', label: 'Tous départements' },
    ...DEPARTMENTS.map((d) => ({ value: d.label, label: d.label })),
  ];

  const handleDepartmentChange = (value: string) => {
    const dept = value === 'all' ? null : value;
    setDepartment(dept);
    setCity(null);
    if (!dept) {
      setSelectedCinemas([]);
      return;
    }
    const deptCities = DEPARTMENTS.find((d) => d.label === dept)?.cities ?? [];
    setSelectedCinemas(cinemas.filter((c) => deptCities.includes(c.city)).map((c) => c.id));
  };

  const handleCityChange = (value: string) => {
    const city = value === 'all' ? null : value;
    setCity(city);
    if (!city) {
      if (selectedDepartment) {
        const deptCities = DEPARTMENTS.find((d) => d.label === selectedDepartment)?.cities ?? [];
        setSelectedCinemas(cinemas.filter((c) => deptCities.includes(c.city)).map((c) => c.id));
      } else {
        setSelectedCinemas([]);
      }
      return;
    }
    setSelectedCinemas(cinemas.filter((c) => c.city === city).map((c) => c.id));
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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 md:gap-3">
        <FilterSelect label="Tri" value={sort} options={SORT_OPTIONS} onChange={(v) => setSort(v as SortOption)} />
        <FilterSelect label="Version" value={version ?? 'all'} options={VERSION_OPTIONS} onChange={(v) => setVersion(v === 'all' ? null : (v as 'VF' | 'VO' | 'VOST'))} />
        <FilterSelect label="Horaires" value={timeSlot} options={TIME_SLOT_OPTIONS} onChange={(v) => setTimeSlot(v as TimeSlotFilter)} />
        <FilterSelect label="Âge du film" value={String(minAge)} options={MIN_AGE_OPTIONS} onChange={(v) => setMinAge(Number(v) as MinAgeFilter)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
        <FilterSelect label="Département" value={selectedDepartment ?? 'all'} options={departmentOptions} onChange={handleDepartmentChange} />
        <FilterSelect label="Ville" value={selectedCity ?? 'all'} options={cityOptions} onChange={handleCityChange} />
      </div>

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
