import { matchesDay } from '../../utils/matchesDay';

describe('matchesDay', () => {
  // 2026-03-09 is Monday, 2026-03-10 is Tuesday, etc.
  // Let's use known dates:
  // 2026-03-09 = Monday
  // 2026-03-10 = Tuesday
  // 2026-03-11 = Wednesday
  // 2026-03-12 = Thursday
  // 2026-03-13 = Friday
  // 2026-03-14 = Saturday
  // 2026-03-15 = Sunday

  const monday = '2026-03-09T14:00:00';
  const tuesday = '2026-03-10T14:00:00';
  const wednesday = '2026-03-11T14:00:00';
  const thursday = '2026-03-12T14:00:00';
  const friday = '2026-03-13T14:00:00';
  const saturday = '2026-03-14T14:00:00';
  const sunday = '2026-03-15T14:00:00';

  it('"all" always returns true', () => {
    expect(matchesDay(monday, 'all')).toBe(true);
    expect(matchesDay(friday, 'all')).toBe(true);
    expect(matchesDay(sunday, 'all')).toBe(true);
  });

  it('"weekday" returns true for Mon-Thu', () => {
    expect(matchesDay(monday, 'weekday')).toBe(true);
    expect(matchesDay(tuesday, 'weekday')).toBe(true);
    expect(matchesDay(wednesday, 'weekday')).toBe(true);
    expect(matchesDay(thursday, 'weekday')).toBe(true);
  });

  it('"weekday" returns false for Fri-Sun', () => {
    expect(matchesDay(friday, 'weekday')).toBe(false);
    expect(matchesDay(saturday, 'weekday')).toBe(false);
    expect(matchesDay(sunday, 'weekday')).toBe(false);
  });

  it('"weekend" returns true for Fri-Sun', () => {
    expect(matchesDay(friday, 'weekend')).toBe(true);
    expect(matchesDay(saturday, 'weekend')).toBe(true);
    expect(matchesDay(sunday, 'weekend')).toBe(true);
  });

  it('"weekend" returns false for Mon-Thu', () => {
    expect(matchesDay(monday, 'weekend')).toBe(false);
    expect(matchesDay(tuesday, 'weekend')).toBe(false);
    expect(matchesDay(wednesday, 'weekend')).toBe(false);
    expect(matchesDay(thursday, 'weekend')).toBe(false);
  });

  it('specific day index 0 matches Monday', () => {
    expect(matchesDay(monday, '0')).toBe(true);
    expect(matchesDay(tuesday, '0')).toBe(false);
  });

  it('specific day index 4 matches Friday', () => {
    expect(matchesDay(friday, '4')).toBe(true);
    expect(matchesDay(monday, '4')).toBe(false);
  });

  it('specific day index 6 matches Sunday', () => {
    expect(matchesDay(sunday, '6')).toBe(true);
    expect(matchesDay(saturday, '6')).toBe(false);
  });
});
