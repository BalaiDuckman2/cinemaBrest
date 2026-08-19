import { useNavigate } from 'react-router-dom';
import { addToSoiree, makeSoireeItem } from '../../stores/soireeStore';
import { localISODate, weekOffsetForDate } from '../../utils/dates';
import type { FilmListItem, ShowtimeEntry } from '../../types/components';

interface PlanSoireeButtonProps {
  film: Pick<FilmListItem, 'id' | 'title' | 'posterUrl' | 'runtime'>;
  showtime: ShowtimeEntry;
  city: string | undefined;
  /** Contexte : dimensions et padding additionnels. */
  className?: string;
}

/**
 * Unique bouton d'une ligne de séance hors de la page de planification : il
 * ajoute la séance à la soirée de son jour, puis y emmène. L'ancien couple
 * « ajouter » / « enchaîner » demandait deux gestes pour une seule intention.
 *
 * Pas de toast : on atterrit sur `/soiree`, la séance y est visible.
 */
export function PlanSoireeButton({ film, showtime, city, className = '' }: PlanSoireeButtonProps) {
  const navigate = useNavigate();
  const date = showtime.datetime.slice(0, 10);

  const handleClick = () => {
    addToSoiree(makeSoireeItem(film, showtime, city));
    const params = new URLSearchParams({ date });
    if (city) params.set('city', city);
    // `useWeekNavigation` lit `?week=` : sans lui, une séance d'une autre
    // semaine ouvrirait la page sur la semaine courante, qui ne la contient pas.
    const week = weekOffsetForDate(date, localISODate());
    if (week !== 0) params.set('week', String(week));
    navigate(`/soiree?${params.toString()}`);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      title="Planifier ma soirée autour de cette séance"
      aria-label={`Planifier ma soirée autour de ${film.title} à ${showtime.time}`}
      className={`flex shrink-0 items-center justify-center rounded-md border-2 border-sepia-chaud bg-beige-papier text-sepia-chaud transition-colors hover:border-rouge-cinema hover:text-rouge-cinema ${className}`}
    >
      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6M9 16h4" />
      </svg>
    </button>
  );
}
