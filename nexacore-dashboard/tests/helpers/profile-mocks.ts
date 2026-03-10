import type {
  SafeUser,
  PasskeyResponse,
  TrustedDeviceResponse,
  SecurityEvent,
} from '@/lib/types';

export function mockUser(overrides?: Partial<SafeUser>): SafeUser {
  return {
    id: '1',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    avatarUrl: null,
    role: 'USER',
    emailVerified: true,
    isActive: true,
    mfaEnabled: false,
    hasPassword: true,
    oauthProviders: [],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

export function mockPasskey(overrides?: Partial<PasskeyResponse>): PasskeyResponse {
  return {
    id: '1',
    name: 'My Passkey',
    deviceType: 'platform',
    backedUp: false,
    transports: ['internal'],
    lastUsedAt: null,
    createdAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

export function mockTrustedDevice(overrides?: Partial<TrustedDeviceResponse>): TrustedDeviceResponse {
  return {
    id: '1',
    deviceName: 'Chrome on Windows',
    ipAddress: '192.168.1.1',
    lastVerifiedAt: '2026-03-01T12:00:00Z',
    expiresAt: '2026-04-01T00:00:00Z',
    createdAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

export function mockSecurityEvent(overrides?: Partial<SecurityEvent>): SecurityEvent {
  return {
    id: '1',
    action: 'LOGIN_SUCCESS',
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0',
    metadata: null,
    createdAt: '2026-03-01T12:00:00Z',
    ...overrides,
  };
}
