import { matchesTimeSlot } from '../../utils/matchesTimeSlot';

describe('matchesTimeSlot', () => {
  it('"all" always returns true', () => {
    expect(matchesTimeSlot('09:00', 'all')).toBe(true);
    expect(matchesTimeSlot('14:30', 'all')).toBe(true);
    expect(matchesTimeSlot('20:00', 'all')).toBe(true);
    expect(matchesTimeSlot('23:00', 'all')).toBe(true);
  });

  it('"morning" matches hours < 12', () => {
    expect(matchesTimeSlot('09:00', 'morning')).toBe(true);
    expect(matchesTimeSlot('11:59', 'morning')).toBe(true);
    expect(matchesTimeSlot('00:00', 'morning')).toBe(true);
  });

  it('"morning" does not match hours >= 12', () => {
    expect(matchesTimeSlot('12:00', 'morning')).toBe(false);
    expect(matchesTimeSlot('18:00', 'morning')).toBe(false);
  });

  it('"afternoon" matches 12 <= hour < 18', () => {
    expect(matchesTimeSlot('12:00', 'afternoon')).toBe(true);
    expect(matchesTimeSlot('14:30', 'afternoon')).toBe(true);
    expect(matchesTimeSlot('17:59', 'afternoon')).toBe(true);
  });

  it('"afternoon" does not match outside range', () => {
    expect(matchesTimeSlot('11:59', 'afternoon')).toBe(false);
    expect(matchesTimeSlot('18:00', 'afternoon')).toBe(false);
  });

  it('"evening" matches 18 <= hour < 22', () => {
    expect(matchesTimeSlot('18:00', 'evening')).toBe(true);
    expect(matchesTimeSlot('20:30', 'evening')).toBe(true);
    expect(matchesTimeSlot('21:59', 'evening')).toBe(true);
  });

  it('"evening" does not match outside range', () => {
    expect(matchesTimeSlot('17:59', 'evening')).toBe(false);
    expect(matchesTimeSlot('22:00', 'evening')).toBe(false);
  });

  it('"night" matches hour >= 22', () => {
    expect(matchesTimeSlot('22:00', 'night')).toBe(true);
    expect(matchesTimeSlot('23:30', 'night')).toBe(true);
  });

  it('"night" does not match hour < 22', () => {
    expect(matchesTimeSlot('21:59', 'night')).toBe(false);
    expect(matchesTimeSlot('14:00', 'night')).toBe(false);
  });

  it('returns false for invalid time format', () => {
    expect(matchesTimeSlot('invalid', 'morning')).toBe(false);
  });

  it('handles single-digit hours', () => {
    expect(matchesTimeSlot('9:00', 'morning')).toBe(true);
  });
});
