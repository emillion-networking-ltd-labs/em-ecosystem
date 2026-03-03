import { Test, TestingModule } from '@nestjs/testing';
import { GeolocationService } from '../geolocation.service';

// Mock maxmind module
jest.mock('maxmind', () => ({
  open: jest.fn(),
}));

import * as maxmind from 'maxmind';

describe('GeolocationService', () => {
  let service: GeolocationService;
  const mockReader = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    (maxmind.open as jest.Mock).mockResolvedValue(mockReader);

    const module: TestingModule = await Test.createTestingModule({
      providers: [GeolocationService],
    }).compile();

    service = module.get<GeolocationService>(GeolocationService);
    await service.onModuleInit();
  });

  describe('isPrivateIp', () => {
    it('should return true for 127.0.0.1 (loopback)', () => {
      expect(service.isPrivateIp('127.0.0.1')).toBe(true);
    });

    it('should return true for 10.x.x.x (class A private)', () => {
      expect(service.isPrivateIp('10.0.0.1')).toBe(true);
      expect(service.isPrivateIp('10.255.255.255')).toBe(true);
    });

    it('should return true for 172.16-31.x.x (class B private)', () => {
      expect(service.isPrivateIp('172.16.0.1')).toBe(true);
      expect(service.isPrivateIp('172.31.255.255')).toBe(true);
    });

    it('should return true for 192.168.x.x (class C private)', () => {
      expect(service.isPrivateIp('192.168.0.1')).toBe(true);
      expect(service.isPrivateIp('192.168.255.255')).toBe(true);
    });

    it('should return true for ::1 (IPv6 loopback)', () => {
      expect(service.isPrivateIp('::1')).toBe(true);
    });

    it('should return true for unknown and empty string', () => {
      expect(service.isPrivateIp('unknown')).toBe(true);
      expect(service.isPrivateIp('')).toBe(true);
      expect(service.isPrivateIp('localhost')).toBe(true);
    });

    it('should return false for valid public IPs', () => {
      expect(service.isPrivateIp('8.8.8.8')).toBe(false);
      expect(service.isPrivateIp('1.1.1.1')).toBe(false);
      expect(service.isPrivateIp('203.0.113.1')).toBe(false);
    });
  });

  describe('lookupIp', () => {
    it('should return GeolocationResult for valid public IP', () => {
      mockReader.get.mockReturnValue({
        city: { names: { en: 'Madrid' } },
        country: { names: { en: 'Spain' }, iso_code: 'ES' },
        location: { latitude: 40.4168, longitude: -3.7038 },
      });

      const result = service.lookupIp('203.0.113.1');
      expect(result).toEqual({
        city: 'Madrid',
        country: 'Spain',
        countryCode: 'ES',
        latitude: 40.4168,
        longitude: -3.7038,
      });
    });

    it('should return null for private IP', () => {
      expect(service.lookupIp('192.168.1.1')).toBeNull();
      expect(mockReader.get).not.toHaveBeenCalled();
    });

    it('should return null when reader is null (DB not loaded)', async () => {
      (maxmind.open as jest.Mock).mockRejectedValue(new Error('File not found'));
      const module = await Test.createTestingModule({
        providers: [GeolocationService],
      }).compile();
      const svc = module.get<GeolocationService>(GeolocationService);
      await svc.onModuleInit();

      expect(svc.lookupIp('8.8.8.8')).toBeNull();
    });

    it('should return cached result on second lookup', () => {
      mockReader.get.mockReturnValue({
        city: { names: { en: 'Madrid' } },
        country: { names: { en: 'Spain' }, iso_code: 'ES' },
        location: { latitude: 40.4168, longitude: -3.7038 },
      });

      service.lookupIp('8.8.8.8');
      service.lookupIp('8.8.8.8');

      expect(mockReader.get).toHaveBeenCalledTimes(1);
    });

    it('should return null on MaxMind lookup error (fail-open)', () => {
      mockReader.get.mockImplementation(() => {
        throw new Error('Corrupt database');
      });

      expect(service.lookupIp('8.8.8.8')).toBeNull();
    });

    it('should return null when response has no coordinates', () => {
      mockReader.get.mockReturnValue({
        city: { names: { en: 'Unknown' } },
        country: { names: { en: 'Unknown' }, iso_code: 'XX' },
        location: {},
      });

      expect(service.lookupIp('203.0.113.1')).toBeNull();
    });

    it('should handle null city gracefully', () => {
      mockReader.get.mockReturnValue({
        country: { names: { en: 'Spain' }, iso_code: 'ES' },
        location: { latitude: 40.4168, longitude: -3.7038 },
      });

      const result = service.lookupIp('203.0.113.1');
      expect(result).toEqual({
        city: null,
        country: 'Spain',
        countryCode: 'ES',
        latitude: 40.4168,
        longitude: -3.7038,
      });
    });
  });

  describe('onModuleDestroy', () => {
    it('should clear cache and nullify reader', () => {
      mockReader.get.mockReturnValue({
        city: { names: { en: 'Test' } },
        country: { names: { en: 'Test' }, iso_code: 'TS' },
        location: { latitude: 1, longitude: 1 },
      });
      service.lookupIp('8.8.8.8');

      service.onModuleDestroy();

      // After destroy, lookups should return null (reader is null)
      expect(service.lookupIp('8.8.8.8')).toBeNull();
    });
  });
});
