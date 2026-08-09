import { roundToNearestQuarter } from './money';

describe('roundToNearestQuarter', () => {
  it('rounds down when closer to the lower quarter', () => {
    expect(roundToNearestQuarter(49.31)).toBe(49.25);
  });

  it('rounds up when closer to the upper quarter', () => {
    expect(roundToNearestQuarter(49.39)).toBe(49.5);
  });

  it('leaves an exact quarter untouched', () => {
    expect(roundToNearestQuarter(49.5)).toBe(49.5);
  });

  it('rounds a midpoint up', () => {
    expect(roundToNearestQuarter(49.375)).toBe(49.5);
  });
});
