import { describe, it, expect } from 'vitest';
import {
  firstSelectableDate,
  formatWeekLabel,
  weekDatesFrom,
} from '../utils/dates';

// Repères : 2026-07-20 et 2026-07-27 lundis, 2026-07-26 et 2026-08-02 dimanches,
// 2026-07-29 mercredi, 2026-08-03 et 2026-12-28 lundis.

describe('weekDatesFrom', () => {
  it('renvoie 7 dates consécutives en incluant le départ', () => {
    expect(weekDatesFrom('2026-07-27')).toEqual([
      '2026-07-27',
      '2026-07-28',
      '2026-07-29',
      '2026-07-30',
      '2026-07-31',
      '2026-08-01',
      '2026-08-02',
    ]);
  });

  it('franchit le changement d année', () => {
    expect(weekDatesFrom('2026-12-28')).toEqual([
      '2026-12-28',
      '2026-12-29',
      '2026-12-30',
      '2026-12-31',
      '2027-01-01',
      '2027-01-02',
      '2027-01-03',
    ]);
  });
});

describe('firstSelectableDate', () => {
  const semaineCourante = weekDatesFrom('2026-07-27'); // 27 juil -> 2 aout

  it('renvoie aujourd hui quand la semaine est en cours', () => {
    expect(firstSelectableDate(semaineCourante, '2026-07-29')).toBe('2026-07-29');
  });

  it('renvoie le lundi quand la semaine est a venir', () => {
    expect(firstSelectableDate(weekDatesFrom('2026-08-03'), '2026-07-29')).toBe('2026-08-03');
  });

  it('renvoie le dernier jour quand la semaine est revolue', () => {
    expect(firstSelectableDate(weekDatesFrom('2026-07-20'), '2026-07-29')).toBe('2026-07-26');
  });

  it('gere le dimanche, dernier jour selectionnable de la semaine courante', () => {
    expect(firstSelectableDate(semaineCourante, '2026-08-02')).toBe('2026-08-02');
  });

  it('retombe sur aujourd hui quand la semaine n est pas encore chargee', () => {
    expect(firstSelectableDate([], '2026-07-29')).toBe('2026-07-29');
  });
});

describe('formatWeekLabel', () => {
  it('formate les deux bornes en jour + mois abrege', () => {
    expect(formatWeekLabel('2026-07-27', '2026-08-02')).toBe('27 juil. - 2 août');
  });

  it('n abrege pas les mois deja courts', () => {
    expect(formatWeekLabel('2026-03-02', '2026-03-08')).toBe('2 mars - 8 mars');
  });

  it('renvoie une chaine vide tant que la meta n est pas chargee', () => {
    expect(formatWeekLabel(undefined, undefined)).toBe('');
    expect(formatWeekLabel('2026-07-27', undefined)).toBe('');
  });
});
