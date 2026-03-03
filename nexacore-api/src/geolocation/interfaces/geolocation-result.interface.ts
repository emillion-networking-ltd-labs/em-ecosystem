export interface GeolocationResult {
  city: string | null;
  country: string | null;
  countryCode: string | null;
  latitude: number;
  longitude: number;
}

export interface ImpossibleTravelResult {
  isAnomalous: boolean;
  previousLocation: GeolocationResult | null;
  currentLocation: GeolocationResult;
  distanceKm: number;
  elapsedHours: number;
  requiredSpeedKmh: number;
  strategy: 'alert_only' | 'challenge' | 'block';
  actionTaken: 'allowed' | 'challenged' | 'blocked';
}
