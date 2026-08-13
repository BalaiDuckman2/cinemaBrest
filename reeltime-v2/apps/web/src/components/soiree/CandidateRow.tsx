import type { ChainCandidate } from '../../utils/chaining';
import { formatGap } from '../../utils/chaining';
import { getCinemaShortName } from '../../utils/cinemaNames';
import { AddToSoireeButton } from './AddToSoireeButton';

const NO_POSTER = '/images/no-poster.svg';

export function CandidateRow({
  candidate,
  city,
  onClick,
  onChain,
}: {
  candidate: ChainCandidate;
  city: string | undefined;
  onClick: () => void;
  /** Re-centre la recherche d'enchaînement sur cette séance. Absent = bouton masqué. */
  onChain?: () => void;
}) {
  const { film, showtime, gapMin, sameCinema, approx } = candidate;
  return (
    <div className="flex items-stretch gap-1.5">
      <button
        type="button"
        onClick={onClick}
        className="flex-1 min-w-0 text-left bg-creme-ecran border-2 border-sepia-chaud rounded-lg p-2 flex gap-3 items-center hover:border-rouge-cinema transition-colors"
      >
        <img
          src={film.posterUrl ?? NO_POSTER}
          alt=""
          loading="lazy"
          decoding="async"
          className="w-10 h-[60px] object-cover rounded shadow flex-shrink-0 border border-sepia-chaud/50 bg-beige-papier"
          onError={(e) => { e.currentTarget.src = NO_POSTER; }}
        />
        <div className="flex-1 min-w-0">
          <p className="font-playfair font-bold text-noir-velours text-sm leading-tight truncate">
            {film.title}
          </p>
          <p className="font-bebas text-xs text-noir-velours mt-0.5 tracking-wide">
            {showtime.time}
            <span className="text-sepia-chaud"> · {getCinemaShortName(showtime.cinemaName)}</span>
            {showtime.version && showtime.version !== 'VF' && (
              <span className="text-sepia-chaud"> · {showtime.version}</span>
            )}
          </p>
          <p className="font-crimson text-xs italic text-sepia-chaud">
            {formatGap(gapMin)}
            {approx ? ' (durée estimée)' : ''}
            {sameCinema ? ' · même cinéma' : ''}
          </p>
        </div>
      </button>
      <AddToSoireeButton film={film} showtime={showtime} city={city} className="px-2" />
      {onChain && (
        <button
          type="button"
          onClick={onChain}
          title="Enchaîner à partir de cette séance"
          aria-label={`Chercher les séances enchaînables autour de ${film.title} à ${showtime.time}`}
          className="flex items-center justify-center rounded-md border-2 border-sepia-chaud bg-beige-papier px-2 text-sepia-chaud transition-colors hover:border-rouge-cinema hover:text-rouge-cinema"
        >
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5-5 5M6 7l5 5-5 5" />
          </svg>
        </button>
      )}
    </div>
  );
}
