const DAYS_FR = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const DAYS_FR_SHORT = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];
const MONTHS_FR = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
];

/** Today's date in the user's local timezone, as YYYY-MM-DD. */
export function localISODate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** The 7 dates (YYYY-MM-DD) starting at weekStart. */
export function weekDatesFrom(weekStart: string): string[] {
  const base = new Date(weekStart + 'T12:00:00Z');
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(base);
    d.setUTCDate(base.getUTCDate() + i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

/** "mar. 16" */
export function formatDayShort(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00Z');
  return `${DAYS_FR_SHORT[d.getUTCDay()]} ${d.getUTCDate()}`;
}

/** "Mardi 16 juin" */
export function formatDayLong(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00Z');
  const day = DAYS_FR[d.getUTCDay()];
  return `${day.charAt(0).toUpperCase()}${day.slice(1)} ${d.getUTCDate()} ${MONTHS_FR[d.getUTCMonth()]}`;
}
