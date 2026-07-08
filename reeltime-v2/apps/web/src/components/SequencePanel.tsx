import { useMemo } from 'react';
import type { FilmListItem, ShowtimeEntry } from '../types/components';
import {
  findChainable,
  estimatedEnd,
  toMinutes,
  formatClock,
} from '../utils/chaining';
import { formatDayLong } from '../utils/dates';
import { getCinemaShortName } from '../utils/cinemaNames';
import { AddToSoireeButton } from './soiree/AddToSoireeButton';
import { CandidateRow } from './soiree/CandidateRow';

interface SequencePanelProps {
  anchorFilm: FilmListItem;
  anchor: ShowtimeEntry;
  films: FilmListItem[];
  cityOf: (cinemaId: string) => string | undefined;
  onFilmClick: (film: FilmListItem) => void;
  onBack: () => void;
}

export function SequencePanel({ anchorFilm, anchor, films, cityOf, onFilmClick, onBack }: SequencePanelProps) {
  const after = useMemo(
    () => findChainable({ films, anchorFilm, anchor, direction: 'after', cityOf }),
    [films, anchorFilm, anchor, cityOf],
  );
  const before = useMemo(
    () => findChainable({ films, anchorFilm, anchor, direction: 'before', cityOf }),
    [films, anchorFilm, anchor, cityOf],
  );

  const endMin = estimatedEnd(toMinutes(anchor.time), anchorFilm.runtime);
  const endStr = `${anchorFilm.runtime == null ? '~' : ''}${formatClock(endMin)}`;

  return (
    <div className="mb-8">
      <button
        type="button"
        onClick={onBack}
        className="font-bebas mb-4 flex items-center gap-1.5 text-sm text-rouge-cinema uppercase tracking-wide hover:text-bordeaux-profond transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
        </svg>
        Retour au film
      </button>

      <h4 className="font-bebas text-rouge-cinema text-2xl uppercase tracking-wider mb-1">
        Enchaîner les séances
      </h4>
      <p className="font-crimson text-sm text-sepia-chaud italic mb-4">
        {formatDayLong(anchor.datetime.slice(0, 10))} · {anchorFilm.title} à {anchor.time} ({getCinemaShortName(anchor.cinemaName)}), fin estimée {endStr}
      </p>

      <AddToSoireeButton
        film={anchorFilm}
        showtime={anchor}
        city={cityOf(anchor.cinemaId)}
        label="Ajouter cette séance"
        className="px-3 py-1.5 mb-5 font-bebas text-xs uppercase tracking-wide"
      />

      <h5 className="font-bebas text-noir-velours text-base uppercase tracking-wider mb-2 flex items-center gap-2">
        <span className="w-1 h-4 bg-rouge-cinema rounded-full" />
        Après cette séance
      </h5>
      {after.length > 0 ? (
        <div className="space-y-2 mb-5">
          {after.map((c) => (
            <CandidateRow
              key={c.showtime.id}
              candidate={c}
              city={cityOf(c.showtime.cinemaId)}
              onClick={() => onFilmClick(c.film)}
            />
          ))}
        </div>
      ) : (
        <p className="font-crimson text-sm text-sepia-chaud italic mb-5">
          Aucune séance enchaînable après (battement max 1h, même ville).
        </p>
      )}

      <h5 className="font-bebas text-noir-velours text-base uppercase tracking-wider mb-2 flex items-center gap-2">
        <span className="w-1 h-4 bg-rouge-cinema rounded-full" />
        Avant cette séance
      </h5>
      {before.length > 0 ? (
        <div className="space-y-2">
          {before.map((c) => (
            <CandidateRow
              key={c.showtime.id}
              candidate={c}
              city={cityOf(c.showtime.cinemaId)}
              onClick={() => onFilmClick(c.film)}
            />
          ))}
        </div>
      ) : (
        <p className="font-crimson text-sm text-sepia-chaud italic">
          Aucune séance se terminant juste avant (même ville).
        </p>
      )}

      <p className="font-crimson text-[11px] text-sepia-chaud/70 italic mt-4">
        Fins de séances estimées : durée du film + 15 min de publicités.
      </p>
    </div>
  );
}
