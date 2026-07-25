import { useState } from 'react';
import { useFiltersStore } from '../../stores/filtersStore';
import { FilterControls } from './FilterControls';
import { ActiveFilterTags } from './ActiveFilterTags';

interface Cinema {
  id: string;
  name: string;
  city: string;
}

interface FilterBarProps {
  cinemas: Cinema[];
  activeFilterCount: number;
}

/**
 * Rendu desktop des filtres : recherche, étiquettes actives et panneau
 * accordéon. Sur mobile, ces trois morceaux vivent séparément — recherche et
 * étiquettes dans la barre collée, réglages dans FilterSheet.
 */
export function FilterBar({ cinemas, activeFilterCount }: FilterBarProps) {
  const [expanded, setExpanded] = useState(false);
  const searchQuery = useFiltersStore((s) => s.searchQuery);
  const setSearchQuery = useFiltersStore((s) => s.setSearchQuery);

  return (
    <div className="space-y-2">
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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          aria-expanded={expanded}
          aria-label="Filtres"
          className={`font-bebas px-3 py-2 border-2 rounded-lg text-sm uppercase tracking-wide transition flex items-center gap-1.5 shadow-sm ${
            expanded
              ? 'bg-rouge-cinema/20 border-rouge-cinema text-noir-velours'
              : 'bg-beige-papier border-sepia-chaud text-noir-velours hover:bg-creme-ecran hover:border-rouge-cinema'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          {activeFilterCount > 0 && (
            <span className="bg-rouge-cinema text-creme-ecran text-[11px] font-bebas px-1.5 py-0.5 rounded-full">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      <ActiveFilterTags cinemas={cinemas} />

      <div className={`filter-panel ${expanded ? 'filter-panel-open' : ''}`}>
        <div>
          <div className="bg-beige-papier border-2 border-sepia-chaud rounded-xl p-4 shadow-md">
            <FilterControls cinemas={cinemas} />
          </div>
        </div>
      </div>
    </div>
  );
}
