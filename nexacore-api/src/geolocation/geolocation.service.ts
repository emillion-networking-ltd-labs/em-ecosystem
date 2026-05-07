import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import * as maxmind from 'maxmind';
import { GeolocationResult } from './interfaces/geolocation-result.interface';
import {
  MAXMIND_DB_PATH,
  GEOLOCATION_CACHE_MAX_SIZE,
  GEOLOCATION_CACHE_TTL_HOURS,
  PRIVATE_IP_PREFIXES,
} from './constants/geolocation.constants';

interface CacheEntry {
  result: GeolocationResult | null;
  timestamp: number;
}

@Injectable()
export class GeolocationService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(GeolocationService.name);
  private reader: maxmind.Reader<maxmind.CityResponse> | null = null;
  private cache = new Map<string, CacheEntry>();
  private cacheTtlMs = GEOLOCATION_CACHE_TTL_HOURS * 60 * 60 * 1000;

  async onModuleInit(): Promise<void> {
    try {
      this.reader = await maxmind.open<maxmind.CityResponse>(MAXMIND_DB_PATH);
      this.logger.log(
        `MaxMind GeoLite2 database loaded from ${MAXMIND_DB_PATH}`,
      );
    } catch (error) {
      this.logger.warn(
        `MaxMind GeoLite2 database not available at ${MAXMIND_DB_PATH}. ` +
          'Geolocation features will be disabled. ' +
          `Error: ${error instanceof Error ? error.message : String(error)}`,
      );
      this.reader = null;
    }
  }

  onModuleDestroy(): void {
    this.cache.clear();
    this.reader = null;
  }

  isPrivateIp(ip: string): boolean {
    if (!ip || ip === 'unknown' || ip === 'localhost') return true;
    return PRIVATE_IP_PREFIXES.some((prefix) => ip.startsWith(prefix));
  }

  lookupIp(ip: string): GeolocationResult | null {
    if (this.isPrivateIp(ip)) return null;
    if (!this.reader) return null;

    const cached = this.cache.get(ip);
    if (cached && Date.now() - cached.timestamp < this.cacheTtlMs) {
      return cached.result;
    }

    try {
      const response = this.reader.get(ip);
      if (
        !response ||
        !response.location?.latitude ||
        !response.location?.longitude
      ) {
        this.cacheSet(ip, null);
        return null;
      }

      const result: GeolocationResult = {
        city: response.city?.names?.en || null,
        country: response.country?.names?.en || null,
        countryCode: response.country?.iso_code || null,
        latitude: response.location.latitude,
        longitude: response.location.longitude,
      };

      this.cacheSet(ip, result);
      return result;
    } catch (error) {
      this.logger.error(
        `Geolocation lookup failed for IP ${ip}: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }

  private cacheSet(ip: string, result: GeolocationResult | null): void {
    if (this.cache.size >= GEOLOCATION_CACHE_MAX_SIZE) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }
    this.cache.set(ip, { result, timestamp: Date.now() });
  }
}
