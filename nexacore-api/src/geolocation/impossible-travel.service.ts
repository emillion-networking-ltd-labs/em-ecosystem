import { Injectable, Logger } from '@nestjs/common';
import { GeolocationService } from './geolocation.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { MailService } from '../mail/mail.service';
import { AuditAction } from '../audit/enums/audit-action.enum';
import {
  GeolocationResult,
  ImpossibleTravelResult,
} from './interfaces/geolocation-result.interface';
import {
  IMPOSSIBLE_TRAVEL_SPEED_KMH,
  IMPOSSIBLE_TRAVEL_MIN_DISTANCE_KM,
  IMPOSSIBLE_TRAVEL_ALERT_STRATEGY,
} from './constants/geolocation.constants';

const EARTH_RADIUS_KM = 6371;

@Injectable()
export class ImpossibleTravelService {
  private readonly logger = new Logger(ImpossibleTravelService.name);

  constructor(
    private readonly geolocationService: GeolocationService,
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly mailService: MailService,
  ) {}

  haversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(EARTH_RADIUS_KM * c * 10) / 10;
  }

  async detectImpossibleTravel(params: {
    userId: string;
    ipAddress: string;
    email: string;
    firstName: string | null;
    userAgent: string | null;
    mfaEnabled: boolean;
  }): Promise<ImpossibleTravelResult | null> {
    const currentGeo = this.geolocationService.lookupIp(params.ipAddress);
    if (!currentGeo) return null;

    const previousSession = await this.prisma.session.findFirst({
      where: {
        userId: params.userId,
        isRevoked: false,
        latitude: { not: null },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        locationCity: true,
        locationCountry: true,
        latitude: true,
        longitude: true,
        createdAt: true,
        ipAddress: true,
      },
    });

    if (
      !previousSession ||
      !previousSession.latitude ||
      !previousSession.longitude
    ) {
      return null;
    }

    if (previousSession.ipAddress === params.ipAddress) return null;

    const distanceKm = this.haversineDistance(
      previousSession.latitude,
      previousSession.longitude,
      currentGeo.latitude,
      currentGeo.longitude,
    );

    if (distanceKm < IMPOSSIBLE_TRAVEL_MIN_DISTANCE_KM) return null;

    const elapsedMs = Date.now() - previousSession.createdAt.getTime();
    const elapsedHours = Math.max(elapsedMs / (1000 * 60 * 60), 0.001);
    const requiredSpeedKmh = Math.round((distanceKm / elapsedHours) * 10) / 10;

    const previousLocation: GeolocationResult = {
      city: previousSession.locationCity,
      country: null,
      countryCode: previousSession.locationCountry,
      latitude: previousSession.latitude,
      longitude: previousSession.longitude,
    };

    if (requiredSpeedKmh <= IMPOSSIBLE_TRAVEL_SPEED_KMH) {
      return {
        isAnomalous: false,
        previousLocation,
        currentLocation: currentGeo,
        distanceKm,
        elapsedHours: Math.round(elapsedHours * 100) / 100,
        requiredSpeedKmh,
        strategy: IMPOSSIBLE_TRAVEL_ALERT_STRATEGY,
        actionTaken: 'allowed',
      };
    }

    // Anomaly detected
    let actionTaken: 'allowed' | 'challenged' | 'blocked';
    if (IMPOSSIBLE_TRAVEL_ALERT_STRATEGY === 'block') {
      actionTaken = 'blocked';
    } else if (
      IMPOSSIBLE_TRAVEL_ALERT_STRATEGY === 'challenge' &&
      params.mfaEnabled
    ) {
      actionTaken = 'challenged';
    } else {
      actionTaken = 'allowed';
    }

    const result: ImpossibleTravelResult = {
      isAnomalous: true,
      previousLocation,
      currentLocation: currentGeo,
      distanceKm,
      elapsedHours: Math.round(elapsedHours * 100) / 100,
      requiredSpeedKmh,
      strategy: IMPOSSIBLE_TRAVEL_ALERT_STRATEGY,
      actionTaken,
    };

    this.auditService
      .log({
        action: AuditAction.IMPOSSIBLE_TRAVEL_DETECTED,
        userId: params.userId,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        metadata: {
          previousLocation: {
            city: previousSession.locationCity,
            country: previousSession.locationCountry,
          },
          currentLocation: {
            city: currentGeo.city,
            country: currentGeo.countryCode,
          },
          distanceKm,
          elapsedHours: result.elapsedHours,
          requiredSpeedKmh,
          strategy: IMPOSSIBLE_TRAVEL_ALERT_STRATEGY,
          actionTaken,
        },
      })
      .catch(() => {});

    this.mailService
      .sendImpossibleTravelAlert(params.email, {
        firstName: params.firstName,
        previousCity: previousSession.locationCity,
        previousCountry: previousSession.locationCountry,
        currentCity: currentGeo.city,
        currentCountry: currentGeo.countryCode,
        distanceKm,
        elapsedHours: result.elapsedHours,
        requiredSpeedKmh,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        actionTaken,
      })
      .catch(() => {});

    return result;
  }
}
