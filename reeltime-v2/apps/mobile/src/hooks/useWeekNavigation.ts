import { useState, useCallback, useMemo } from 'react';

const DAYS_FR = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];
const MONTHS_FR = [
  'janv.', 'fevr.', 'mars', 'avr.', 'mai', 'juin',
  'juil.', 'aout', 'sept.', 'oct.', 'nov.', 'dec.',
];

function getWeekLabel(offset: number): string {
  if (offset === 0) return 'Cette semaine';

  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() + offset * 7);
  // Move to Monday
  const dayOfWeek = start.getDay();
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  start.setDate(start.getDate() + diffToMonday);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  const startStr = `${DAYS_FR[start.getDay()]} ${start.getDate()} ${MONTHS_FR[start.getMonth()]}`;
  const endStr = `${DAYS_FR[end.getDay()]} ${end.getDate()} ${MONTHS_FR[end.getMonth()]}`;
  return `${startStr} - ${endStr}`;
}

export function useWeekNavigation() {
  const [weekOffset, setWeekOffset] = useState(0);

  const nextWeek = useCallback(() => setWeekOffset((prev) => prev + 1), []);
  const prevWeek = useCallback(() => setWeekOffset((prev) => prev - 1), []);
  const goToday = useCallback(() => setWeekOffset(0), []);

  const weekLabel = useMemo(() => getWeekLabel(weekOffset), [weekOffset]);

  return { weekOffset, weekLabel, nextWeek, prevWeek, goToday };
}
