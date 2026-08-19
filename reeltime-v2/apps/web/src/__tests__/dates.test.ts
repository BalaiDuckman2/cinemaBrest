import { describe, it, expect } from 'vitest';
import {
  firstSelectableDate,
  formatWeekLabel,
  weekDatesFrom,
  weekOffsetForDate,
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

describe('weekOffsetForDate', () => {
  // 2026-08-17 est un lundi, 2026-08-23 le dimanche qui le suit.
  const LUNDI = '2026-08-17';
  const DIMANCHE = '2026-08-23';

  it('rend 0 pour aujourd hui', () => {
    expect(weekOffsetForDate(LUNDI, LUNDI)).toBe(0);
  });

  it('rend 0 partout dans la semaine courante', () => {
    expect(weekOffsetForDate(LUNDI, '2026-08-19')).toBe(0);
    expect(weekOffsetForDate(DIMANCHE, '2026-08-19')).toBe(0);
    expect(weekOffsetForDate('2026-08-19', LUNDI)).toBe(0);
    expect(weekOffsetForDate('2026-08-19', DIMANCHE)).toBe(0);
  });

  it('rend 1 pour la semaine suivante', () => {
    expect(weekOffsetForDate('2026-08-24', '2026-08-19')).toBe(1);
    expect(weekOffsetForDate('2026-08-30', '2026-08-19')).toBe(1);
  });

  it('rend -1 pour la semaine precedente', () => {
    expect(weekOffsetForDate('2026-08-10', '2026-08-19')).toBe(-1);
    expect(weekOffsetForDate('2026-08-16', '2026-08-19')).toBe(-1);
  });

  // Le bord ou ce calcul casse : deux jours consecutifs a cheval sur le lundi.
  it('separe le dimanche et le lundi qui le suit', () => {
    expect(weekOffsetForDate('2026-08-24', DIMANCHE)).toBe(1);
    expect(weekOffsetForDate(DIMANCHE, '2026-08-24')).toBe(-1);
  });

  it('compte plusieurs semaines dans les deux sens', () => {
    expect(weekOffsetForDate('2026-09-14', '2026-08-19')).toBe(4);
    expect(weekOffsetForDate('2026-07-20', '2026-08-19')).toBe(-4);
  });

  // Changement d heure fin octobre : le calcul ne doit pas deriver d une heure.
  it('traverse le changement d heure sans deriver', () => {
    expect(weekOffsetForDate('2026-11-02', '2026-10-19')).toBe(2);
  });
});
