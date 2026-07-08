import { useSoireeStore, addToSoiree, makeSoireeItem } from '../../stores/soireeStore';
import type { FilmListItem, ShowtimeEntry } from '../../types/components';

interface AddToSoireeButtonProps {
  film: Pick<FilmListItem, 'id' | 'title' | 'posterUrl' | 'runtime'>;
  showtime: ShowtimeEntry;
  city: string | undefined;
  /** Contexte : padding / typo additionnels. */
  className?: string;
  /** Variante avec texte (ex. « Ajouter cette séance »). Sans label : icône seule. */
  label?: string;
}

export function AddToSoireeButton({ film, showtime, city, className = '', label }: AddToSoireeButtonProps) {
  const added = useSoireeStore((s) =>
    (s.soirees[showtime.datetime.slice(0, 10)] ?? []).some((i) => i.showtimeId === showtime.id),
  );

  return (
    <button
      type="button"
      disabled={added}
      onClick={() => addToSoiree(makeSoireeItem(film, showtime, city))}
      title={added ? 'Déjà dans ma soirée' : 'Ajouter à ma soirée'}
      aria-label={
        added
          ? `${film.title} à ${showtime.time} est déjà dans ma soirée`
          : `Ajouter ${film.title} à ${showtime.time} à ma soirée`
      }
      className={`flex items-center justify-center gap-1.5 rounded-md border-2 transition-colors ${
        added
          ? 'border-or-antique bg-or-antique/20 text-sepia-chaud cursor-default'
          : 'border-sepia-chaud bg-beige-papier text-sepia-chaud hover:text-rouge-cinema hover:border-rouge-cinema'
      } ${className}`}
    >
      {added ? (
        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
        </svg>
      )}
      {label && <span>{label}</span>}
    </button>
  );
}
