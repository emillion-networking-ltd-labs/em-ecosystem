import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { TenantRole } from '@prisma/client';
import { InvitationResponseDto } from '../dto/invitation-response.dto';

describe('InvitationResponseDto', () => {
  it('reflects all assigned properties (fresh-create shape with token populated)', () => {
    const dto = new InvitationResponseDto();
    dto.id = 'aaaa1111-aaaa-1111-aaaa-aaaa11111111';
    dto.tenantId = 'cccc3333-cccc-3333-cccc-cccc33333333';
    dto.email = 'invitee@example.com';
    dto.role = TenantRole.MEMBER;
    dto.token = 'plaintext-43-char-token-abcdefghijklmnopqrstuv';
    dto.expiresAt = new Date('2026-06-01T00:00:00Z');
    dto.createdAt = new Date('2026-05-19T00:00:00Z');

    expect(dto.id).toBe('aaaa1111-aaaa-1111-aaaa-aaaa11111111');
    expect(dto.tenantId).toBe('cccc3333-cccc-3333-cccc-cccc33333333');
    expect(dto.email).toBe('invitee@example.com');
    expect(dto.role).toBe(TenantRole.MEMBER);
    expect(dto.token).toBe('plaintext-43-char-token-abcdefghijklmnopqrstuv');
    expect(dto.expiresAt).toEqual(new Date('2026-06-01T00:00:00Z'));
    expect(dto.createdAt).toEqual(new Date('2026-05-19T00:00:00Z'));
  });

  it('supports the idempotent-duplicate shape where token is null', () => {
    const dto = new InvitationResponseDto();
    dto.id = 'aaaa1111-aaaa-1111-aaaa-aaaa11111111';
    dto.tenantId = 'cccc3333-cccc-3333-cccc-cccc33333333';
    dto.email = 'invitee@example.com';
    dto.role = TenantRole.ADMIN;
    dto.token = null;
    dto.expiresAt = new Date('2026-06-01T00:00:00Z');
    dto.createdAt = new Date('2026-05-19T00:00:00Z');

    expect(dto.token).toBeNull();
  });

  it('populates all properties when constructed via plainToInstance from a raw payload', () => {
    const payload = {
      id: 'aaaa1111-aaaa-1111-aaaa-aaaa11111111',
      tenantId: 'cccc3333-cccc-3333-cccc-cccc33333333',
      email: 'invitee@example.com',
      role: TenantRole.VIEWER,
      token: null,
      expiresAt: new Date('2026-06-01T00:00:00Z'),
      createdAt: new Date('2026-05-19T00:00:00Z'),
    };
    const dto = plainToInstance(InvitationResponseDto, payload);

    expect(dto).toBeInstanceOf(InvitationResponseDto);
    expect(dto.id).toBe(payload.id);
    expect(dto.tenantId).toBe(payload.tenantId);
    expect(dto.email).toBe(payload.email);
    expect(dto.role).toBe(TenantRole.VIEWER);
    expect(dto.token).toBeNull();
    expect(dto.expiresAt).toEqual(payload.expiresAt);
    expect(dto.createdAt).toEqual(payload.createdAt);
  });
});
