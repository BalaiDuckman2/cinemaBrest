import { describe, it, expect } from 'vitest';
import {
  addDays,
  firstSelectableDate,
  formatWeekLabel,
  mondayOf,
  rangeDates,
  rangeEnd,
  weekDatesFrom,
  weeksNeededFor,
} from '../utils/dates';

// Repères : 2026-07-25 samedi, 2026-07-26 dimanche, 2026-07-27 lundi.

describe('addDays', () => {
  it('avance et recule', () => {
    expect(addDays('2026-07-25', 1)).toBe('2026-07-26');
    expect(addDays('2026-07-25', -1)).toBe('2026-07-24');
    expect(addDays('2026-07-25', 0)).toBe('2026-07-25');
  });

  it('franchit les mois et les années', () => {
    expect(addDays('2026-07-31', 1)).toBe('2026-08-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
  });

  it('ignore les changements d heure', () => {
    // Passage à l'heure d'été en France : nuit du 28 au 29 mars 2026.
    expect(addDays('2026-03-28', 1)).toBe('2026-03-29');
    // Passage à l'heure d'hiver : nuit du 24 au 25 octobre 2026.
    expect(addDays('2026-10-24', 1)).toBe('2026-10-25');
  });
});

describe('mondayOf', () => {
  it('renvoie le lundi de la semaine', () => {
    expect(mondayOf('2026-07-27')).toBe('2026-07-27'); // lundi -> lui-même
    expect(mondayOf('2026-07-25')).toBe('2026-07-20'); // samedi
    expect(mondayOf('2026-07-26')).toBe('2026-07-20'); // dimanche, pas le lundi suivant
  });
});

describe('rangeDates', () => {
  it('inclut les deux bornes', () => {
    expect(rangeDates('2026-07-25', '2026-07-27')).toEqual([
      '2026-07-25',
      '2026-07-26',
      '2026-07-27',
    ]);
  });

  it('renvoie un seul jour quand les bornes sont égales', () => {
    expect(rangeDates('2026-07-25', '2026-07-25')).toEqual(['2026-07-25']);
  });

  it('renvoie une liste vide quand la fin précède le début', () => {
    expect(rangeDates('2026-07-27', '2026-07-25')).toEqual([]);
  });
});

describe('rangeEnd', () => {
  it('renvoie le dimanche de la dernière semaine chargée', () => {
    expect(rangeEnd('2026-07-27', 2)).toBe('2026-08-09'); // lundi -> 14 jours
    expect(rangeEnd('2026-07-25', 2)).toBe('2026-08-02'); // samedi -> 9 jours
    expect(rangeEnd('2026-07-26', 2)).toBe('2026-08-02'); // dimanche -> 8 jours, le minimum
  });

  it('une seule semaine s arrête au dimanche courant', () => {
    expect(rangeEnd('2026-07-25', 1)).toBe('2026-07-26');
  });
});

describe('weeksNeededFor', () => {
  it('demande une semaine pour aujourd hui ou le passé', () => {
    expect(weeksNeededFor('2026-07-25', '2026-07-25')).toBe(1);
    expect(weeksNeededFor('2026-07-01', '2026-07-25')).toBe(1);
  });

  it('demande une semaine pour une date de la semaine courante', () => {
    expect(weeksNeededFor('2026-07-26', '2026-07-25')).toBe(1);
  });

  it('compte les semaines calendaires d écart', () => {
    expect(weeksNeededFor('2026-07-27', '2026-07-25')).toBe(2); // semaine suivante
    expect(weeksNeededFor('2026-08-09', '2026-07-25')).toBe(3);
  });

  it('reste cohérent avec rangeEnd', () => {
    const today = '2026-07-25';
    const target = '2026-08-09';
    expect(rangeEnd(today, weeksNeededFor(target, today)) >= target).toBe(true);
  });
});

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
