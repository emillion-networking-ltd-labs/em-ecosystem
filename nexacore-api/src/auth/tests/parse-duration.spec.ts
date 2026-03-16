import { parseDurationMs } from '../utils/parse-duration';

describe('parseDurationMs', () => {
  it('should parse seconds', () => {
    expect(parseDurationMs('30s')).toBe(30_000);
  });

  it('should parse minutes', () => {
    expect(parseDurationMs('15m')).toBe(900_000);
  });

  it('should parse hours', () => {
    expect(parseDurationMs('2h')).toBe(7_200_000);
  });

  it('should parse days', () => {
    expect(parseDurationMs('7d')).toBe(604_800_000);
  });

  it('should return 7d default for invalid format', () => {
    expect(parseDurationMs('abc')).toBe(604_800_000);
  });

  it('should return 7d default for empty string', () => {
    expect(parseDurationMs('')).toBe(604_800_000);
  });
});
