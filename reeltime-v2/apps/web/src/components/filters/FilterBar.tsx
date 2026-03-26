import { useState } from 'react';
import { useFiltersStore } from '../../stores/filtersStore';
import type { SortOption, DayFilter, TimeSlotFilter, MinAgeFilter } from '../../stores/filtersStore';

const DEPARTMENTS = [
  { label: 'Finist\u00e8re (29)', cities: ['Brest', 'Landerneau', 'Morlaix', 'Quimper'] },
  { label: 'C\u00f4tes-d\'Armor (22)', cities: ['Lannion', 'Perros-Guirec'] },
];

const CINEMA_SHORT_NAMES: Record<string, string> = {
  'Les Studios': 'Studios',
  'CGR Brest Le Celtic': 'CGR',
  'Multiplexe Libert\u00e9': 'Libert\u00e9',
  'Path\u00e9 Capucins': 'Path\u00e9',
  'Cin\u00e9 Galaxy': 'Galaxy',
  'La Salamandre': 'Salamandre',
  'Cin\u00e9ville Morlaix': 'Cin\u00e9ville M.',
  'Cin\u00e9ville Quimper': 'Cin\u00e9ville Q.',
  'Katorza': 'Katorza',
  'Quai Dupleix': 'Dupleix',
};

function getShortName(name: string, city: string): string {
  if (name === 'Les Baladins') {
    return city === 'Perros-Guirec' ? 'Baladins P-G' : 'Baladins Lan.';
  }
  return CINEMA_SHORT_NAMES[name] ?? name;
}

interface Cinema {
  id: string;
  name: string;
  city: string;
}

interface FilterBarProps {
  cinemas: Cinema[];
  activeFilterCount: number;
}

const DAY_LABELS: Record<string, string> = {
  weekday: 'Semaine',
  weekend: 'Weekend',
  '0': 'Lundi',
  '1': 'Mardi',
  '2': 'Mercredi',
  '3': 'Jeudi',
  '4': 'Vendredi',
  '5': 'Samedi',
  '6': 'Dimanche',
};

const TIME_LABELS: Record<string, string> = {
  morning: 'Matin',
  afternoon: 'Après-midi',
  evening: 'Soirée',
  night: 'Nuit',
};

export function FilterBar({ cinemas, activeFilterCount }: FilterBarProps) {
  const [expanded, setExpanded] = useState(false);
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
  const dayFilter = useFiltersStore((s) => s.dayFilter);
  const setDayFilter = useFiltersStore((s) => s.setDayFilter);
  const timeSlot = useFiltersStore((s) => s.timeSlot);
  const setTimeSlot = useFiltersStore((s) => s.setTimeSlot);
  const minAge = useFiltersStore((s) => s.minAge);
  const setMinAge = useFiltersStore((s) => s.setMinAge);
  const searchQuery = useFiltersStore((s) => s.searchQuery);
  const setSearchQuery = useFiltersStore((s) => s.setSearchQuery);
  const resetAll = useFiltersStore((s) => s.resetAll);

  // Compute available cities based on selected department
  const availableCities = selectedDepartment
    ? DEPARTMENTS.find((d) => d.label === selectedDepartment)?.cities ?? []
    : DEPARTMENTS.flatMap((d) => d.cities);

  // Filter visible cinema chips based on department/city selection
  const visibleCinemas = cinemas.filter((cinema) => {
    if (selectedCity) return cinema.city === selectedCity;
    if (selectedDepartment) return availableCities.includes(cinema.city);
    return true;
  });

  const handleDepartmentChange = (value: string) => {
    const dept = value === 'all' ? null : value;
    setDepartment(dept);
    setCity(null);

    if (!dept) {
      setSelectedCinemas([]);
      return;
    }

    const deptCities = DEPARTMENTS.find((d) => d.label === dept)?.cities ?? [];
    const deptCinemaIds = cinemas.filter((c) => deptCities.includes(c.city)).map((c) => c.id);
    setSelectedCinemas(deptCinemaIds);
  };

  const handleCityChange = (value: string) => {
    const city = value === 'all' ? null : value;
    setCity(city);

    if (!city) {
      // Reset to department-level selection
      if (selectedDepartment) {
        const deptCities = DEPARTMENTS.find((d) => d.label === selectedDepartment)?.cities ?? [];
        const deptCinemaIds = cinemas.filter((c) => deptCities.includes(c.city)).map((c) => c.id);
        setSelectedCinemas(deptCinemaIds);
      } else {
        setSelectedCinemas([]);
      }
      return;
    }

    const cityCinemaIds = cinemas.filter((c) => c.city === city).map((c) => c.id);
    setSelectedCinemas(cityCinemaIds);
  };

  const handleVersionChange = (value: string) => {
    setVersion(value === 'all' ? null : (value as 'VF' | 'VO' | 'VOST'));
  };

  // Build active filter tags
  const activeTags: { label: string; onRemove: () => void }[] = [];

  if (version !== null) {
    activeTags.push({ label: version === 'VF' ? 'VF' : 'VO/VOST', onRemove: () => setVersion(null) });
  }
  if (dayFilter !== 'all') {
    activeTags.push({ label: DAY_LABELS[dayFilter] ?? dayFilter, onRemove: () => setDayFilter('all') });
  }
  if (timeSlot !== 'all') {
    activeTags.push({ label: TIME_LABELS[timeSlot] ?? timeSlot, onRemove: () => setTimeSlot('all') });
  }
  if (minAge !== 0) {
    activeTags.push({ label: `+${minAge} ans`, onRemove: () => setMinAge(0) });
  }
  if (selectedDepartment !== null) {
    activeTags.push({ label: selectedDepartment, onRemove: () => handleDepartmentChange('all') });
  }
  if (selectedCity !== null) {
    activeTags.push({ label: selectedCity, onRemove: () => handleCityChange('all') });
  }
  if (selectedCinemas.length > 0 && selectedDepartment === null) {
    activeTags.push({ label: `${selectedCinemas.length} cinéma${selectedCinemas.length > 1 ? 's' : ''}`, onRemove: () => setSelectedCinemas([]) });
  }
  if (sort !== 'popularity') {
    const sortLabels: Record<string, string> = { alphabetical: 'A→Z', 'year-desc': '+ Récent', 'year-asc': '+ Ancien', showtimes: 'Nb séances' };
    activeTags.push({ label: `Tri: ${sortLabels[sort] ?? sort}`, onRemove: () => setSort('popularity') });
  }

  const selectClass = "font-crimson px-2 py-2 bg-creme-ecran border-2 border-sepia-chaud rounded-lg text-noir-velours text-xs focus:outline-none focus:border-rouge-cinema focus:ring-2 focus:ring-rouge-cinema/20";

  return (
    <div className="space-y-2">
      {/* Search + filter toggle */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher un film..."
            aria-label="Rechercher un film"
            className="font-crimson w-full px-3 py-2 bg-creme-ecran border-2 border-sepia-chaud rounded-lg text-noir-velours text-sm placeholder-sepia-chaud/60 focus:outline-none focus:ring-2 focus:ring-rouge-cinema focus:border-rouge-cinema shadow-sm"
          />
          <svg
            className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sepia-chaud"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className={`font-bebas px-3 py-2 border-2 rounded-lg text-sm uppercase tracking-wide transition flex items-center gap-1.5 shadow-sm ${
            expanded
              ? 'bg-rouge-cinema/20 border-rouge-cinema text-noir-velours'
              : 'bg-beige-papier border-sepia-chaud text-noir-velours hover:bg-creme-ecran hover:border-rouge-cinema'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
          </svg>
          {activeFilterCount > 0 && (
            <span className="bg-rouge-cinema text-creme-ecran text-[10px] font-bebas px-1.5 py-0.5 rounded-full">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Active filter tags */}
      {activeTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {activeTags.map((tag) => (
            <button
              key={tag.label}
              type="button"
              onClick={tag.onRemove}
              className="flex items-center gap-1 bg-rouge-cinema/10 border border-rouge-cinema/30 text-rouge-cinema text-xs font-bebas px-2 py-1 rounded-full hover:bg-rouge-cinema/20 transition uppercase tracking-wide"
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
            className="text-xs font-bebas text-sepia-chaud hover:text-rouge-cinema px-2 py-1 uppercase tracking-wide transition"
          >
            Tout effacer
          </button>
        </div>
      )}

      {/* Animated collapsible filters panel */}
      <div className={`filter-panel ${expanded ? 'filter-panel-open' : ''}`}>
        <div>
          <div className="bg-beige-papier border-2 border-sepia-chaud rounded-xl p-3 sm:p-4 space-y-3 shadow-md">
            {/* Select dropdowns grid - 5 columns */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortOption)}
                className={selectClass}
              >
                <option value="popularity">Popularité</option>
                <option value="alphabetical">A→Z</option>
                <option value="year-desc">+ Récent</option>
                <option value="year-asc">+ Ancien</option>
                <option value="showtimes">Nb séances</option>
              </select>

              <select
                value={version ?? 'all'}
                onChange={(e) => handleVersionChange(e.target.value)}
                className={selectClass}
              >
                <option value="all">Toutes versions</option>
                <option value="VF">VF</option>
                <option value="VO">VO/VOST</option>
              </select>

              <select
                value={dayFilter}
                onChange={(e) => setDayFilter(e.target.value as DayFilter)}
                className={selectClass}
              >
                <option value="all">Tous les jours</option>
                <option value="weekday">Semaine (Lun-Jeu)</option>
                <option value="weekend">Weekend (Ven-Dim)</option>
                <option value="0">Lundi</option>
                <option value="1">Mardi</option>
                <option value="2">Mercredi</option>
                <option value="3">Jeudi</option>
                <option value="4">Vendredi</option>
                <option value="5">Samedi</option>
                <option value="6">Dimanche</option>
              </select>

              <select
                value={timeSlot}
                onChange={(e) => setTimeSlot(e.target.value as TimeSlotFilter)}
                className={selectClass}
              >
                <option value="all">Tous horaires</option>
                <option value="morning">Matin</option>
                <option value="afternoon">Après-midi</option>
                <option value="evening">Soirée</option>
                <option value="night">Nuit</option>
              </select>

              <select
                value={minAge}
                onChange={(e) => setMinAge(Number(e.target.value) as MinAgeFilter)}
                className={selectClass}
              >
                <option value="0">Tous films</option>
                <option value="1">+1 an</option>
                <option value="5">+5 ans</option>
                <option value="10">+10 ans</option>
                <option value="20">+20 ans</option>
                <option value="30">+30 ans</option>
                <option value="50">+50 ans</option>
              </select>
            </div>

            {/* Department & City dropdowns */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <select
                value={selectedDepartment ?? 'all'}
                onChange={(e) => handleDepartmentChange(e.target.value)}
                className={selectClass}
              >
                <option value="all">Tous départements</option>
                {DEPARTMENTS.map((dept) => (
                  <option key={dept.label} value={dept.label}>{dept.label}</option>
                ))}
              </select>

              <select
                value={selectedCity ?? 'all'}
                onChange={(e) => handleCityChange(e.target.value)}
                className={selectClass}
              >
                <option value="all">Toutes villes</option>
                {availableCities.map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            {/* Cinema chips with checkboxes */}
            <div className="flex flex-wrap gap-1.5">
              {visibleCinemas.map((cinema) => {
                const isSelected =
                  selectedCinemas.length === 0 || selectedCinemas.includes(cinema.id);
                const shortName = getShortName(cinema.name, cinema.city);

                return (
                  <label
                    key={cinema.id}
                    className={`ticket-chip flex items-center gap-1.5 px-3 py-1.5 border-2 rounded-full font-bebas text-[11px] text-noir-velours uppercase tracking-wide cursor-pointer ${
                      isSelected
                        ? 'bg-creme-ecran border-sepia-chaud'
                        : 'bg-beige-papier border-sepia-chaud/50 opacity-60'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleCinema(cinema.id)}
                      className="w-3.5 h-3.5 rounded accent-rouge-cinema"
                    />
                    {shortName}
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
