import type { DayFilter } from '../stores/useFiltersStore';

/**
 * Check whether a datetime string matches the given day filter.
 * dayIndex: 0=Mon, 6=Sun (ISO convention, not JS getDay())
 */
export function matchesDay(datetime: string, dayFilter: DayFilter): boolean {
  if (dayFilter === 'all') return true;
  const date = new Date(datetime);
  const jsDay = date.getDay();
  const dayIndex = jsDay === 0 ? 6 : jsDay - 1; // 0=Mon, 6=Sun

  if (dayFilter === 'weekday') return dayIndex >= 0 && dayIndex <= 3; // Mon-Thu
  if (dayFilter === 'weekend') return dayIndex >= 4 && dayIndex <= 6; // Fri-Sun
  return dayIndex === parseInt(dayFilter);
}
