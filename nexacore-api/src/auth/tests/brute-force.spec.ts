import {
  getLockoutDurationMs,
  getLockoutDurationMinutes,
  LOCKOUT_DURATIONS_MINUTES,
  MAX_FAILED_ATTEMPTS,
} from '../constants/auth.constants';

describe('Brute Force Protection — Exponential Backoff', () => {
  describe('getLockoutDurationMs', () => {
    it('should return 15 minutes for first lockout (lockoutCount=0)', () => {
      expect(getLockoutDurationMs(0)).toBe(15 * 60 * 1000);
    });

    it('should return 30 minutes for second lockout (lockoutCount=1)', () => {
      expect(getLockoutDurationMs(1)).toBe(30 * 60 * 1000);
    });

    it('should return 60 minutes for third lockout (lockoutCount=2)', () => {
      expect(getLockoutDurationMs(2)).toBe(60 * 60 * 1000);
    });

    it('should return 120 minutes for fourth lockout (lockoutCount=3)', () => {
      expect(getLockoutDurationMs(3)).toBe(120 * 60 * 1000);
    });

    it('should cap at 120 minutes for lockoutCount beyond array length', () => {
      expect(getLockoutDurationMs(10)).toBe(120 * 60 * 1000);
      expect(getLockoutDurationMs(100)).toBe(120 * 60 * 1000);
    });
  });

  describe('getLockoutDurationMinutes', () => {
    it('should return correct minutes for each escalation level', () => {
      LOCKOUT_DURATIONS_MINUTES.forEach((expected, index) => {
        expect(getLockoutDurationMinutes(index)).toBe(expected);
      });
    });

    it('should cap at final value for high lockoutCount', () => {
      const lastDuration =
        LOCKOUT_DURATIONS_MINUTES[LOCKOUT_DURATIONS_MINUTES.length - 1];
      expect(getLockoutDurationMinutes(999)).toBe(lastDuration);
    });
  });

  describe('Constants', () => {
    it('should have MAX_FAILED_ATTEMPTS set to 5', () => {
      expect(MAX_FAILED_ATTEMPTS).toBe(5);
    });

    it('should have escalating lockout durations', () => {
      for (let i = 1; i < LOCKOUT_DURATIONS_MINUTES.length; i++) {
        expect(LOCKOUT_DURATIONS_MINUTES[i]).toBeGreaterThan(
          LOCKOUT_DURATIONS_MINUTES[i - 1],
        );
      }
    });
  });
});
