import { useFiltersStore } from '../../stores/filtersStore';

interface Cinema {
  id: string;
  name: string;
}

interface CinemaFilterProps {
  cinemas: Cinema[];
}

export function CinemaFilter({ cinemas }: CinemaFilterProps) {
  const selectedCinemas = useFiltersStore((s) => s.selectedCinemas);
  const toggleCinema = useFiltersStore((s) => s.toggleCinema);

  return (
    <div className="flex flex-wrap gap-2">
      {cinemas.map((cinema) => {
        const isSelected =
          selectedCinemas.length === 0 || selectedCinemas.includes(cinema.id);
        return (
          <button
            key={cinema.id}
            type="button"
            onClick={() => toggleCinema(cinema.id)}
            className={`rounded-full px-4 py-1 font-bebas text-label tracking-wider transition-colors ${
              isSelected
                ? 'bg-rouge-cinema text-creme-ecran'
                : 'bg-beige-papier text-noir-velours hover:bg-sepia-chaud hover:text-creme-ecran'
            }`}
          >
            {cinema.name}
          </button>
        );
      })}
    </div>
  );
}
