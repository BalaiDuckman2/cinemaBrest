import type { TimeSlotFilter } from '../stores/useFiltersStore';

/**
 * Check whether a time string (e.g. "14:30") matches the given time slot filter.
 */
export function matchesTimeSlot(time: string, timeSlot: TimeSlotFilter): boolean {
  if (timeSlot === 'all') return true;
  const hourMatch = time.match(/^(\d{1,2})/);
  if (!hourMatch) return false;
  const hour = parseInt(hourMatch[1]);

  switch (timeSlot) {
    case 'morning': return hour < 12;
    case 'afternoon': return hour >= 12 && hour < 18;
    case 'evening': return hour >= 18 && hour < 22;
    case 'night': return hour >= 22;
    default: return true;
  }
}
