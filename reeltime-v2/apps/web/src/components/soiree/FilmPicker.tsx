import { useEffect, useState } from 'react';
import type { FilmListItem, ShowtimeEntry } from '../../types/components';
import { getCinemaShortName } from '../../utils/cinemaNames';

const NO_POSTER = '/images/no-poster.svg';

/** Un film et ses seules séances éligibles (jour, ville, heure, version, cinéma). */
export interface PickableFilm {
  film: FilmListItem;
  showtimes: ShowtimeEntry[];
}

interface FilmPickerProps {
  entries: PickableFilm[];
  search: string;
  onSearchChange: (search: string) => void;
  /** Identifiants des séances déjà au plan : leurs puces deviennent inertes. */
  plannedShowtimeIds: Set<string>;
  onPick: (film: FilmListItem, showtime: ShowtimeEntry) => void;
  /** Déplié d'office quand la soirée est vide : c'est alors le sujet de la page. */
  defaultOpen: boolean;
  emptyMessage: string;
}

export function FilmPicker({
  entries,
  search,
  onSearchChange,
  plannedShowtimeIds,
  onPick,
  defaultOpen,
  emptyMessage,
}: FilmPickerProps) {
  const [open, setOpen] = useState(defaultOpen);
  // Le premier ajout fait basculer `defaultOpen` à false : sans cette
  // synchronisation, le bloc resterait déplié et volerait l'écran aux
  // suggestions qui viennent d'apparaître.
  useEffect(() => {
    setOpen(defaultOpen);
  }, [defaultOpen]);
  // Accordéon : une seule ligne dépliée, sinon la liste devient illisible sur mobile.
  const [expandedFilmId, setExpandedFilmId] = useState<string | null>(null);

  return (
    <section className="mb-4">
      {!defaultOpen && (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="font-bebas w-full flex items-center justify-between gap-2 px-3 py-2.5 bg-beige-papier border-2 border-sepia-chaud rounded-lg text-noir-velours text-sm uppercase tracking-wide hover:border-rouge-cinema transition-colors"
        >
          <span>🎬 Choisir un autre film</span>
          <svg
            className={`w-5 h-5 text-sepia-chaud shrink-0 transform transition-transform ${open ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
          </svg>
        </button>
      )}

      {open && (
        <div className={defaultOpen ? '' : 'mt-3'}>
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Rechercher un film..."
            aria-label="Rechercher un film"
            className="font-crimson w-full px-3 py-2 mb-3 bg-creme-ecran border-2 border-sepia-chaud rounded-lg text-noir-velours text-sm placeholder-sepia-chaud/60 focus:outline-none focus:ring-2 focus:ring-rouge-cinema focus:border-rouge-cinema shadow-sm"
          />

          {entries.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-2xl mb-2">🎬</p>
              <p className="font-crimson text-noir-velours">{emptyMessage}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {entries.map(({ film, showtimes }) => {
                const expanded = expandedFilmId === film.id;
                return (
                  <div key={film.id}>
                    <button
                      type="button"
                      onClick={() => setExpandedFilmId(expanded ? null : film.id)}
                      aria-expanded={expanded}
                      className={`w-full text-left bg-creme-ecran border-2 rounded-lg p-2 flex gap-3 items-center transition-colors ${
                        expanded ? 'border-rouge-cinema' : 'border-sepia-chaud hover:border-rouge-cinema'
                      }`}
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
                        <p className="font-bebas text-xs text-sepia-chaud tracking-wide">
                          {film.letterboxdRating != null && (
                            <span className="text-or-antique">★ {film.letterboxdRating.toFixed(1)} · </span>
                          )}
                          {showtimes.length} séance{showtimes.length > 1 ? 's' : ''}
                        </p>
                      </div>
                    </button>

                    {expanded && (
                      <div
                        className="flex flex-wrap gap-1.5 mt-1.5 pl-2"
                        role="group"
                        aria-label={`Séances de ${film.title}`}
                      >
                        {showtimes.map((st) => {
                          const planned = plannedShowtimeIds.has(st.id);
                          return (
                            <button
                              key={st.id}
                              type="button"
                              disabled={planned}
                              onClick={() => {
                                onPick(film, st);
                                setExpandedFilmId(null);
                              }}
                              aria-label={
                                planned
                                  ? `${film.title} à ${st.time} est déjà dans ma soirée`
                                  : `Ajouter ${film.title} à ${st.time} à ma soirée`
                              }
                              className={`font-bebas px-3 py-1.5 rounded-full border-2 text-xs uppercase tracking-wide transition-colors ${
                                planned
                                  ? 'border-or-antique bg-or-antique/20 text-sepia-chaud cursor-default'
                                  : 'bg-creme-ecran border-sepia-chaud text-noir-velours hover:border-rouge-cinema'
                              }`}
                            >
                              {planned ? '✓ ' : '+ '}
                              {st.time} · {getCinemaShortName(st.cinemaName)}
                              {st.version ? ` · ${st.version}` : ''}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
