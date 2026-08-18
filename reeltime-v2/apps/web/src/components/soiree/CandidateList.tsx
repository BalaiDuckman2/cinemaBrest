import type { ChainCandidate } from '../../utils/chaining';
import { formatDuration } from '../../utils/chaining';
import { CandidateRow } from './CandidateRow';

interface CandidateListProps {
  title: string;
  candidates: ChainCandidate[];
  /** Nombre de candidats avant application des filtres version/cinéma. */
  unfilteredCount: number;
  cityOf: (cinemaId: string) => string | undefined;
  onOpenFilm: (candidate: ChainCandidate) => void;
  maxGap: number;
  /** Texte de repli quand il n'y a rien à enchaîner, filtres exclus. */
  emptyMessage: string;
  onRelaxFilters: () => void;
}

export function CandidateList({
  title,
  candidates,
  unfilteredCount,
  cityOf,
  onOpenFilm,
  maxGap,
  emptyMessage,
  onRelaxFilters,
}: CandidateListProps) {
  // Deux vides très différents : « rien ne s'enchaîne » se corrige en bougeant
  // l'heure ou le battement, « tes filtres masquent tout » se corrige d'un clic.
  const hiddenByFilters = candidates.length === 0 && unfilteredCount > 0;

  return (
    <section className="mb-5">
      <h3 className="font-bebas text-noir-velours text-base uppercase tracking-wider mb-2 flex items-center gap-2">
        <span className="w-1 h-4 bg-rouge-cinema rounded-full" />
        {title}
        {candidates.length > 0 && (
          <span className="font-crimson text-xs text-sepia-chaud italic normal-case tracking-normal">
            {candidates.length} séance{candidates.length > 1 ? 's' : ''}
          </span>
        )}
      </h3>

      {candidates.length > 0 ? (
        <div className="space-y-2">
          {candidates.map((c) => (
            <CandidateRow
              key={c.showtime.id}
              candidate={c}
              city={cityOf(c.showtime.cinemaId)}
              onClick={() => onOpenFilm(c)}
            />
          ))}
        </div>
      ) : hiddenByFilters ? (
        <div className="font-crimson text-sm text-sepia-chaud italic">
          <p>
            {unfilteredCount} séance{unfilteredCount > 1 ? 's' : ''} s'enchaîne
            {unfilteredCount > 1 ? 'nt' : ''} ici, mais tes filtres de version et de cinéma les
            masquent.
          </p>
          <button
            type="button"
            onClick={onRelaxFilters}
            className="font-bebas mt-1 text-xs text-rouge-cinema uppercase tracking-wide hover:text-bordeaux-profond transition-colors"
          >
            Relâcher les filtres
          </button>
        </div>
      ) : (
        <p className="font-crimson text-sm text-sepia-chaud italic">
          {emptyMessage} (battement max {formatDuration(maxGap)}, même ville)
        </p>
      )}
    </section>
  );
}
