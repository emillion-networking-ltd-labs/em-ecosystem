export const BRUTE_FORCE_WINDOW_MINUTES = parseInt(
  process.env.BRUTE_FORCE_WINDOW_MINUTES || '15',
  10,
);

export const BRUTE_FORCE_THRESHOLD = parseInt(
  process.env.BRUTE_FORCE_THRESHOLD || '10',
  10,
);

export const CREDENTIAL_STUFFING_THRESHOLD = parseInt(
  process.env.CREDENTIAL_STUFFING_THRESHOLD || '20',
  10,
);

export const UNUSUAL_HOURS_SAMPLE_SIZE = parseInt(
  process.env.UNUSUAL_HOURS_SAMPLE_SIZE || '20',
  10,
);

export const UNUSUAL_HOURS_STDDEV_THRESHOLD = parseInt(
  process.env.UNUSUAL_HOURS_STDDEV_THRESHOLD || '3',
  10,
);

export const UNUSUAL_HOURS_MIN_LOGINS = 5;
