import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useSoireeStore } from '../stores/soireeStore';
import { SoireeItemRow, SoireeGapRow, timeLabel, endLabel } from '../components/soiree/SoireeTimeline';
import { formatDayLong, localISODate, nowHHMM } from '../utils/dates';

export function MesSoireesPage() {
  const soirees = useSoireeStore((s) => s.soirees);
  const remove = useSoireeStore((s) => s.remove);
  const clearDate = useSoireeStore((s) => s.clearDate);

  const dates = useMemo(() => Object.keys(soirees).sort(), [soirees]);
  const today = localISODate();
  const now = nowHHMM();

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 max-w-4xl">
      <h1 className="font-bebas text-rouge-cinema text-2xl sm:text-3xl uppercase tracking-wider mb-1">
        🎟 Mes soirées
      </h1>
      <p className="font-crimson text-sm text-sepia-chaud italic mb-5">
        Tes soirées à venir. Pour en construire une, passe par l'affiche ou « Planifier ma soirée ».
      </p>

      {dates.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-2xl mb-3">🍿</p>
          <p className="font-crimson text-noir-velours mb-4">Aucune soirée planifiée</p>
          <div className="flex justify-center gap-2">
            <Link
              to="/"
              className="font-bebas rounded bg-rouge-cinema px-4 py-2 text-sm text-creme-ecran uppercase tracking-wide transition-colors hover:bg-bordeaux-profond"
            >
              Voir l'affiche
            </Link>
            <Link
              to="/soiree"
              className="font-bebas rounded border-2 border-sepia-chaud px-4 py-2 text-sm text-noir-velours uppercase tracking-wide transition-colors hover:border-rouge-cinema"
            >
              Planifier ma soirée
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {dates.map((date) => {
            const items = soirees[date];
            const multiCity = new Set(items.map((i) => i.city).filter((c) => c !== '')).size > 1;
            return (
              <section
                key={date}
                aria-label={formatDayLong(date)}
                className="bg-beige-papier border-2 border-sepia-chaud rounded-xl p-3 sm:p-4 shadow-md"
              >
                <div className="flex items-baseline justify-between gap-2 flex-wrap mb-2">
                  <h2 className="font-bebas text-noir-velours text-lg uppercase tracking-wider">
                    {formatDayLong(date)}
                    <span className="font-crimson text-sm text-sepia-chaud italic normal-case tracking-normal">
                      {' '}· {items.length} film{items.length > 1 ? 's' : ''} · {timeLabel(items[0].time)} → {endLabel(items[items.length - 1])}
                    </span>
                  </h2>
                  <button
                    type="button"
                    onClick={() => clearDate(date)}
                    className="font-bebas text-xs text-sepia-chaud hover:text-rouge-cinema uppercase tracking-wide transition-colors"
                  >
                    Tout effacer
                  </button>
                </div>

                {multiCity && (
                  <p className="font-crimson text-xs italic text-rouge-cinema mb-1.5">⚠ villes différentes</p>
                )}

                <div className="space-y-1.5">
                  {items.map((item, idx) => (
                    <div key={item.showtimeId}>
                      {idx > 0 && <SoireeGapRow prev={items[idx - 1]} next={item} />}
                      <SoireeItemRow
                        item={item}
                        past={item.date === today && item.time < now}
                        onRemove={() => remove(date, item.showtimeId)}
                      />
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
