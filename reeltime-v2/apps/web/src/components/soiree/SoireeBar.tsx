import { useEffect, useMemo, useState } from 'react';
import { useSoireeStore, addToSoiree, makeSoireeItem, nextSoireeDate, type SoireeItem } from '../../stores/soireeStore';
import { useFilms } from '../../hooks/useFilms';
import { useCinemas } from '../../hooks/useCinemas';
import { findChainable, formatGap, type ChainCandidate } from '../../utils/chaining';
import { formatDayShort, localISODate, nowHHMM, weekDatesFrom } from '../../utils/dates';
import { getCinemaShortName } from '../../utils/cinemaNames';
import { SoireeItemRow, SoireeGapRow, timeLabel, endLabel } from './SoireeTimeline';
import type { ShowtimeEntry } from '../../types/components';

const NO_POSTER = '/images/no-poster.svg';

/** Reconstruit une ShowtimeEntry depuis un snapshot pour ancrer findChainable. */
function toShowtimeEntry(item: SoireeItem): ShowtimeEntry {
  return {
    id: item.showtimeId,
    filmId: item.filmId,
    cinemaId: item.cinemaId,
    cinemaName: item.cinemaName,
    datetime: `${item.date}T${item.time}:00`,
    time: item.time,
    version: (item.version ?? 'VF') as ShowtimeEntry['version'],
    bookingUrl: item.bookingUrl,
  };
}

function SuggestionRow({ candidate, city }: { candidate: ChainCandidate; city: string | undefined }) {
  const { film, showtime, gapMin, sameCinema } = candidate;
  return (
    <button
      type="button"
      onClick={() => addToSoiree(makeSoireeItem(film, showtime, city))}
      className="w-full text-left flex items-center gap-2.5 bg-creme-ecran border border-sepia-chaud/50 rounded-lg p-1.5 hover:border-rouge-cinema transition-colors"
    >
      <img
        src={film.posterUrl ?? NO_POSTER}
        alt=""
        loading="lazy"
        decoding="async"
        className="w-7 h-[42px] object-cover rounded shadow flex-shrink-0 border border-sepia-chaud/50 bg-beige-papier"
        onError={(e) => { e.currentTarget.src = NO_POSTER; }}
      />
      <div className="flex-1 min-w-0">
        <p className="font-playfair font-bold text-noir-velours text-xs leading-tight truncate">
          {film.title}
        </p>
        <p className="font-crimson text-[11px] italic text-sepia-chaud truncate">
          {timeLabel(showtime.time)} · {getCinemaShortName(showtime.cinemaName)} · {formatGap(gapMin)}
          {sameCinema ? ' · même ciné' : ''}
        </p>
      </div>
      <svg className="w-4 h-4 text-sepia-chaud shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
      </svg>
    </button>
  );
}

export function SoireeBar() {
  const soirees = useSoireeStore((s) => s.soirees);
  const activeDate = useSoireeStore((s) => s.activeDate);
  const setActiveDate = useSoireeStore((s) => s.setActiveDate);
  const remove = useSoireeStore((s) => s.remove);
  const clearDate = useSoireeStore((s) => s.clearDate);
  const purgeExpired = useSoireeStore((s) => s.purgeExpired);
  const [expanded, setExpanded] = useState(false);

  // Auto-expiration : purge au montage de l'app des soirées de dates passées.
  useEffect(() => {
    purgeExpired(localISODate());
  }, [purgeExpired]);

  // La barre lit useFilms(0) + useCinemas elle-même (React Query déduplique avec les pages).
  const { data } = useFilms(0);
  const { data: cinemas = [] } = useCinemas();

  const cityByCinemaId = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of cinemas) map.set(c.id, c.city);
    return map;
  }, [cinemas]);

  const weekDates = useMemo(
    () => (data?.meta.weekStart ? weekDatesFrom(data.meta.weekStart) : []),
    [data?.meta.weekStart],
  );

  const soireeDates = useMemo(() => Object.keys(soirees).sort(), [soirees]);
  const nextDate = nextSoireeDate(soirees);
  // Dépliée : soirée active si valide, sinon la prochaine à venir.
  const displayDate = activeDate && soirees[activeDate] ? activeDate : nextDate;
  const items = displayDate ? soirees[displayDate] : [];

  const inPlan = useMemo(() => new Set(items.map((i) => i.showtimeId)), [items]);

  const cityOf = (cinemaId: string) => cityByCinemaId.get(cinemaId);

  // Sections absentes si les données de la semaine ne couvrent pas la date affichée.
  const before = useMemo(() => {
    if (!data || !displayDate || !weekDates.includes(displayDate) || items.length === 0) return [];
    const anchor = items[0];
    return findChainable({
      films: data.films,
      anchorFilm: { id: anchor.filmId, runtime: anchor.runtime },
      anchor: toShowtimeEntry(anchor),
      direction: 'before',
      cityOf: (id) => cityByCinemaId.get(id),
    })
      .filter((c) => !inPlan.has(c.showtime.id))
      .slice(0, 5);
  }, [data, displayDate, weekDates, items, cityByCinemaId, inPlan]);

  const after = useMemo(() => {
    if (!data || !displayDate || !weekDates.includes(displayDate) || items.length === 0) return [];
    const anchor = items[items.length - 1];
    return findChainable({
      films: data.films,
      anchorFilm: { id: anchor.filmId, runtime: anchor.runtime },
      anchor: toShowtimeEntry(anchor),
      direction: 'after',
      cityOf: (id) => cityByCinemaId.get(id),
    })
      .filter((c) => !inPlan.has(c.showtime.id))
      .slice(0, 5);
  }, [data, displayDate, weekDates, items, cityByCinemaId, inPlan]);

  if (!nextDate || !displayDate || items.length === 0) return null;

  const today = localISODate();
  const now = nowHHMM();
  const multiCity = new Set(items.map((i) => i.city).filter((c) => c !== '')).size > 1;
  // Repliée : résumé de la PROCHAINE soirée à venir (spec §2).
  const nextItems = soirees[nextDate];
  const othersCount = soireeDates.length - 1;

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 sm:inset-x-auto sm:right-4 sm:bottom-4 sm:w-[28rem] sm:max-w-[calc(100vw-2rem)]">
      <div className="bg-beige-papier border-t-2 sm:border-2 border-sepia-chaud sm:rounded-xl shadow-2xl pb-[env(safe-area-inset-bottom)]">
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          aria-expanded={expanded}
          className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left"
        >
          <span className="font-bebas text-noir-velours text-sm uppercase tracking-wide truncate">
            🎟 Ma soirée · {formatDayShort(nextDate)} · {nextItems.length} film{nextItems.length > 1 ? 's' : ''} ·{' '}
            {timeLabel(nextItems[0].time)} → {endLabel(nextItems[nextItems.length - 1])}
            {othersCount > 0 && <span className="text-sepia-chaud"> · +{othersCount}</span>}
          </span>
          <svg
            className={`w-5 h-5 text-sepia-chaud shrink-0 transform transition-transform ${
              expanded ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
          </svg>
        </button>

        {expanded && (
          <div className="px-3 pb-3 max-h-[55vh] overflow-y-auto border-t border-sepia-chaud/30 pt-2 space-y-1.5">
            {soireeDates.length > 1 && (
              <div className="flex gap-1.5 overflow-x-auto pb-1" role="group" aria-label="Choisir une soirée">
                {soireeDates.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setActiveDate(d)}
                    aria-pressed={d === displayDate}
                    className={`font-bebas shrink-0 px-3 py-1 rounded-full border-2 text-xs uppercase tracking-wide transition-colors ${
                      d === displayDate
                        ? 'bg-rouge-cinema border-bordeaux-profond text-creme-ecran shadow-md'
                        : 'bg-creme-ecran border-sepia-chaud text-noir-velours hover:border-rouge-cinema'
                    }`}
                  >
                    {formatDayShort(d)}
                  </button>
                ))}
              </div>
            )}

            {multiCity && (
              <p className="font-crimson text-xs italic text-rouge-cinema">⚠ villes différentes</p>
            )}

            {/* Films choisis en premier (spec §2) */}
            {items.map((item, idx) => (
              <div key={item.showtimeId}>
                {idx > 0 && <SoireeGapRow prev={items[idx - 1]} next={item} />}
                <SoireeItemRow
                  item={item}
                  past={item.date === today && item.time < now}
                  onRemove={() => remove(displayDate, item.showtimeId)}
                />
              </div>
            ))}

            {/* Suggestions, séparées visuellement */}
            {(before.length > 0 || after.length > 0) && (
              <div className="mt-2 pt-2 border-t border-sepia-chaud/30 space-y-1.5">
                <h6 className="font-bebas text-sepia-chaud text-xs uppercase tracking-wider">
                  Suggestions
                </h6>
                {before.length > 0 && (
                  <div>
                    <p className="font-crimson text-[11px] italic text-sepia-chaud mb-1">+ un film avant</p>
                    <div className="space-y-1.5">
                      {before.map((c) => (
                        <SuggestionRow key={c.showtime.id} candidate={c} city={cityOf(c.showtime.cinemaId)} />
                      ))}
                    </div>
                  </div>
                )}
                {after.length > 0 && (
                  <div>
                    <p className="font-crimson text-[11px] italic text-sepia-chaud mb-1">+ un film après</p>
                    <div className="space-y-1.5">
                      {after.map((c) => (
                        <SuggestionRow key={c.showtime.id} candidate={c} city={cityOf(c.showtime.cinemaId)} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="pt-1 flex justify-end">
              {/* Le lien « Voir tout » vers /mes-soirees arrive en tâche 4 (route pas encore créée) */}
              <button
                type="button"
                onClick={() => clearDate(displayDate)}
                className="font-bebas text-xs text-sepia-chaud hover:text-rouge-cinema uppercase tracking-wide transition-colors"
              >
                Tout effacer
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
