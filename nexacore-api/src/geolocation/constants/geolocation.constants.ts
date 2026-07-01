/**
 * Path to MaxMind GeoLite2-City database file.
 */
export const MAXMIND_DB_PATH =
  process.env.MAXMIND_DB_PATH || './data/GeoLite2-City.mmdb';

/**
 * LRU cache max entries for IP geolocation lookups.
 */
export const GEOLOCATION_CACHE_MAX_SIZE = parseInt(
  process.env.GEOLOCATION_CACHE_MAX_SIZE || '10000',
  10,
);

/**
 * LRU cache TTL in hours.
 */
export const GEOLOCATION_CACHE_TTL_HOURS = parseInt(
  process.env.GEOLOCATION_CACHE_TTL_HOURS || '24',
  10,
);

/**
 * Maximum plausible travel speed in km/h.
 * Default: 900 km/h (approximate commercial airplane speed).
 */
export const IMPOSSIBLE_TRAVEL_SPEED_KMH = parseInt(
  process.env.IMPOSSIBLE_TRAVEL_SPEED_KMH || '900',
  10,
);

/**
 * Minimum distance in km to trigger impossible travel check.
 * Prevents false positives from nearby cities with inaccurate geolocation.
 */
export const IMPOSSIBLE_TRAVEL_MIN_DISTANCE_KM = parseInt(
  process.env.IMPOSSIBLE_TRAVEL_MIN_DISTANCE_KM || '100',
  10,
);

/**
 * Anomaly response strategy.
 * - alert_only: Log audit + send email alert. Login proceeds.
 * - challenge: Force MFA re-verification (override trusted device). If no MFA, alert_only.
 * - block: Reject login with 403 + send email alert.
 */
export const IMPOSSIBLE_TRAVEL_ALERT_STRATEGY = (process.env
  .IMPOSSIBLE_TRAVEL_ALERT_STRATEGY || 'alert_only') as
  'alert_only' | 'challenge' | 'block';

/**
 * Private/reserved IP prefixes that cannot be geolocated.
 */
export const PRIVATE_IP_PREFIXES = [
  '127.',
  '10.',
  '172.16.',
  '172.17.',
  '172.18.',
  '172.19.',
  '172.20.',
  '172.21.',
  '172.22.',
  '172.23.',
  '172.24.',
  '172.25.',
  '172.26.',
  '172.27.',
  '172.28.',
  '172.29.',
  '172.30.',
  '172.31.',
  '192.168.',
  '::1',
  'fc',
  'fd',
];
