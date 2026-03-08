import { useFiltersStore } from '../../stores/filtersStore';

const VERSIONS = [
  { label: 'Tous', value: null },
  { label: 'VF', value: 'VF' as const },
  { label: 'VO', value: 'VO' as const },
  { label: 'VOST', value: 'VOST' as const },
];

export function VersionFilter() {
  const version = useFiltersStore((s) => s.version);
  const setVersion = useFiltersStore((s) => s.setVersion);

  return (
    <div className="flex flex-wrap gap-2">
      {VERSIONS.map((v) => {
        const isActive = version === v.value;
        return (
          <button
            key={v.label}
            type="button"
            onClick={() => setVersion(v.value)}
            className={`rounded-full px-4 py-1 font-bebas text-label tracking-wider transition-colors ${
              isActive
                ? 'bg-or-antique text-noir-velours'
                : 'bg-beige-papier text-noir-velours hover:bg-sepia-chaud hover:text-creme-ecran'
            }`}
          >
            {v.label}
          </button>
        );
      })}
    </div>
  );
}
