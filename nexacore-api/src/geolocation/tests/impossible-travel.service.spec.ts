import { Test, TestingModule } from '@nestjs/testing';
import { ImpossibleTravelService } from '../impossible-travel.service';
import { GeolocationService } from '../geolocation.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { MailService } from '../../mail/mail.service';

describe('ImpossibleTravelService', () => {
  let service: ImpossibleTravelService;
  let geolocationService: { lookupIp: jest.Mock };
  let prisma: { session: { findFirst: jest.Mock } };
  let auditService: { log: jest.Mock };
  let mailService: { sendImpossibleTravelAlert: jest.Mock };

  beforeEach(async () => {
    geolocationService = { lookupIp: jest.fn() };
    prisma = { session: { findFirst: jest.fn() } };
    auditService = { log: jest.fn().mockResolvedValue(undefined) };
    mailService = { sendImpossibleTravelAlert: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImpossibleTravelService,
        { provide: GeolocationService, useValue: geolocationService },
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
        { provide: MailService, useValue: mailService },
      ],
    }).compile();

    service = module.get<ImpossibleTravelService>(ImpossibleTravelService);
  });

  const defaultParams = {
    userId: 'user-1',
    ipAddress: '203.0.113.1',
    email: 'test@example.com',
    firstName: 'Test',
    userAgent: 'Mozilla/5.0 Chrome/120',
    mfaEnabled: false,
  };

  const madridGeo = {
    city: 'Madrid',
    country: 'Spain',
    countryCode: 'ES',
    latitude: 40.4168,
    longitude: -3.7038,
  };

  const newYorkGeo = {
    city: 'New York',
    country: 'United States',
    countryCode: 'US',
    latitude: 40.7128,
    longitude: -74.006,
  };

  describe('haversineDistance', () => {
    it('should return 0 for same coordinates', () => {
      expect(service.haversineDistance(40.4168, -3.7038, 40.4168, -3.7038)).toBe(0);
    });

    it('should calculate correct distance Madrid to New York (~5762 km)', () => {
      const distance = service.haversineDistance(40.4168, -3.7038, 40.7128, -74.006);
      expect(distance).toBeGreaterThan(5700);
      expect(distance).toBeLessThan(5800);
    });

    it('should calculate correct distance London to Tokyo (~9561 km)', () => {
      const distance = service.haversineDistance(51.5074, -0.1278, 35.6762, 139.6503);
      expect(distance).toBeGreaterThan(9500);
      expect(distance).toBeLessThan(9600);
    });
  });

  describe('detectImpossibleTravel', () => {
    it('should return null when geolocation returns null (private IP)', async () => {
      geolocationService.lookupIp.mockReturnValue(null);
      const result = await service.detectImpossibleTravel(defaultParams);
      expect(result).toBeNull();
      expect(prisma.session.findFirst).not.toHaveBeenCalled();
    });

    it('should return null when no previous session exists', async () => {
      geolocationService.lookupIp.mockReturnValue(madridGeo);
      prisma.session.findFirst.mockResolvedValue(null);

      const result = await service.detectImpossibleTravel(defaultParams);
      expect(result).toBeNull();
    });

    it('should return null when same IP address', async () => {
      geolocationService.lookupIp.mockReturnValue(madridGeo);
      prisma.session.findFirst.mockResolvedValue({
        locationCity: 'Madrid',
        locationCountry: 'ES',
        latitude: 40.4168,
        longitude: -3.7038,
        createdAt: new Date(Date.now() - 60 * 60 * 1000),
        ipAddress: '203.0.113.1',
      });

      const result = await service.detectImpossibleTravel(defaultParams);
      expect(result).toBeNull();
    });

    it('should return null when distance < min threshold (100km)', async () => {
      geolocationService.lookupIp.mockReturnValue({
        ...madridGeo,
        latitude: 40.45,
        longitude: -3.72,
      });
      prisma.session.findFirst.mockResolvedValue({
        locationCity: 'Madrid',
        locationCountry: 'ES',
        latitude: 40.4168,
        longitude: -3.7038,
        createdAt: new Date(Date.now() - 60 * 1000),
        ipAddress: '198.51.100.1',
      });

      const result = await service.detectImpossibleTravel(defaultParams);
      expect(result).toBeNull();
    });

    it('should return isAnomalous=false when travel speed is plausible', async () => {
      geolocationService.lookupIp.mockReturnValue(newYorkGeo);
      prisma.session.findFirst.mockResolvedValue({
        locationCity: 'Madrid',
        locationCountry: 'ES',
        latitude: 40.4168,
        longitude: -3.7038,
        createdAt: new Date(Date.now() - 10 * 60 * 60 * 1000), // 10 hours ago
        ipAddress: '198.51.100.1',
      });

      const result = await service.detectImpossibleTravel(defaultParams);
      expect(result).not.toBeNull();
      expect(result!.isAnomalous).toBe(false);
      expect(result!.actionTaken).toBe('allowed');
    });

    it('should return isAnomalous=true when travel speed exceeds threshold', async () => {
      geolocationService.lookupIp.mockReturnValue(newYorkGeo);
      prisma.session.findFirst.mockResolvedValue({
        locationCity: 'Madrid',
        locationCountry: 'ES',
        latitude: 40.4168,
        longitude: -3.7038,
        createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        ipAddress: '198.51.100.1',
      });

      const result = await service.detectImpossibleTravel(defaultParams);
      expect(result).not.toBeNull();
      expect(result!.isAnomalous).toBe(true);
      expect(result!.distanceKm).toBeGreaterThan(5700);
    });

    it('should audit log IMPOSSIBLE_TRAVEL_DETECTED on anomaly', async () => {
      geolocationService.lookupIp.mockReturnValue(newYorkGeo);
      prisma.session.findFirst.mockResolvedValue({
        locationCity: 'Madrid',
        locationCountry: 'ES',
        latitude: 40.4168,
        longitude: -3.7038,
        createdAt: new Date(Date.now() - 30 * 60 * 1000),
        ipAddress: '198.51.100.1',
      });

      await service.detectImpossibleTravel(defaultParams);

      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'IMPOSSIBLE_TRAVEL_DETECTED',
          userId: 'user-1',
        }),
      );
    });

    it('should send email alert on anomaly', async () => {
      geolocationService.lookupIp.mockReturnValue(newYorkGeo);
      prisma.session.findFirst.mockResolvedValue({
        locationCity: 'Madrid',
        locationCountry: 'ES',
        latitude: 40.4168,
        longitude: -3.7038,
        createdAt: new Date(Date.now() - 30 * 60 * 1000),
        ipAddress: '198.51.100.1',
      });

      await service.detectImpossibleTravel(defaultParams);

      expect(mailService.sendImpossibleTravelAlert).toHaveBeenCalledWith(
        'test@example.com',
        expect.objectContaining({
          previousCity: 'Madrid',
          currentCity: 'New York',
        }),
      );
    });

    it('should not throw when email fails (fire-and-forget)', async () => {
      geolocationService.lookupIp.mockReturnValue(newYorkGeo);
      prisma.session.findFirst.mockResolvedValue({
        locationCity: 'Madrid',
        locationCountry: 'ES',
        latitude: 40.4168,
        longitude: -3.7038,
        createdAt: new Date(Date.now() - 30 * 60 * 1000),
        ipAddress: '198.51.100.1',
      });
      mailService.sendImpossibleTravelAlert.mockRejectedValue(
        new Error('SMTP error'),
      );

      await expect(
        service.detectImpossibleTravel(defaultParams),
      ).resolves.not.toThrow();
    });

    it('should return null when previous session has null latitude', async () => {
      geolocationService.lookupIp.mockReturnValue(madridGeo);
      prisma.session.findFirst.mockResolvedValue(null);

      const result = await service.detectImpossibleTravel(defaultParams);
      expect(result).toBeNull();
    });
  });
});
