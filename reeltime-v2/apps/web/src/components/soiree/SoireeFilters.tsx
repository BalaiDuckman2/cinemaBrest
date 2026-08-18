import { SOIREE_VERSION_OPTIONS, type VersionFilter } from '../../utils/soireeFilters';
import { getCinemaShortName } from '../../utils/cinemaNames';
import type { CinemaItem } from '../../api/cinemasApi';

/** Style partagé par tous les `select` de la page. */
export const SOIREE_SELECT_CLASS =
  'font-crimson px-2 py-2 bg-creme-ecran border-2 border-sepia-chaud rounded-lg text-noir-velours text-xs focus:outline-none focus:border-rouge-cinema focus:ring-2 focus:ring-rouge-cinema/20';

const START_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Toute la journée' },
  { value: '14:00', label: 'À partir de 14h' },
  { value: '17:00', label: 'À partir de 17h' },
  { value: '18:00', label: 'À partir de 18h' },
  { value: '19:00', label: 'À partir de 19h' },
  { value: '20:00', label: 'À partir de 20h' },
];

interface SoireeFiltersProps {
  cities: string[];
  city: string;
  onCityChange: (city: string) => void;
  minStart: string;
  onMinStartChange: (minStart: string) => void;
  version: VersionFilter;
  onVersionChange: (version: VersionFilter) => void;
  /** Cinémas de la ville courante, dans l'ordre d'affichage. */
  cinemas: CinemaItem[];
  selectedCinemas: string[];
  onToggleCinema: (cinemaId: string) => void;
  sameCinemaOnly: boolean;
  onSameCinemaOnlyChange: (value: boolean) => void;
  /** Masqué tant que la soirée est vide : sans ancre, « même cinéma » n'a pas de sens. */
  showSameCinemaToggle: boolean;
}

export function SoireeFilters({
  cities,
  city,
  onCityChange,
  minStart,
  onMinStartChange,
  version,
  onVersionChange,
  cinemas,
  selectedCinemas,
  onToggleCinema,
  sameCinemaOnly,
  onSameCinemaOnlyChange,
  showSameCinemaToggle,
}: SoireeFiltersProps) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 max-w-2xl">
        <select
          value={city}
          onChange={(e) => onCityChange(e.target.value)}
          className={SOIREE_SELECT_CLASS}
          aria-label="Ville"
        >
          {cities.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select
          value={minStart}
          onChange={(e) => onMinStartChange(e.target.value)}
          className={SOIREE_SELECT_CLASS}
          aria-label="Heure de début"
        >
          {START_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <select
          value={version}
          onChange={(e) => onVersionChange(e.target.value as VersionFilter)}
          className={SOIREE_SELECT_CLASS}
          aria-label="Version"
        >
          {SOIREE_VERSION_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {cinemas.length > 1 && (
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filtrer par cinéma">
          {cinemas.map((c) => {
            const active = selectedCinemas.includes(c.id);
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => onToggleCinema(c.id)}
                aria-pressed={active}
                className={`font-bebas px-3 py-1.5 rounded-full border-2 text-xs uppercase tracking-wide transition-colors ${
                  active
                    ? 'bg-rouge-cinema border-bordeaux-profond text-creme-ecran shadow-md'
                    : 'bg-creme-ecran border-sepia-chaud text-noir-velours hover:border-rouge-cinema'
                }`}
              >
                {getCinemaShortName(c.name)}
              </button>
            );
          })}
          {selectedCinemas.length > 0 && (
            <span className="font-crimson text-xs text-sepia-chaud italic self-center">
              {selectedCinemas.length} salle{selectedCinemas.length > 1 ? 's' : ''} sur {cinemas.length}
            </span>
          )}
        </div>
      )}

      {showSameCinemaToggle && (
        <label className="flex items-center gap-2 font-crimson text-xs text-noir-velours cursor-pointer">
          <input
            type="checkbox"
            checked={sameCinemaOnly}
            onChange={(e) => onSameCinemaOnlyChange(e.target.checked)}
            className="w-4 h-4 accent-rouge-cinema"
          />
          Rester dans le même cinéma
        </label>
      )}
    </div>
  );
}
