import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { MembershipStatus, TenantRole } from '@prisma/client';
import {
  MemberListResponseDto,
  MemberResponseDto,
} from '../dto/member-response.dto';

describe('MemberResponseDto', () => {
  it('reflects all 6 assigned properties', () => {
    const dto = new MemberResponseDto();
    dto.userId = 'aaaa1111-aaaa-1111-aaaa-aaaa11111111';
    dto.email = 'member@example.com';
    dto.role = TenantRole.MEMBER;
    dto.status = MembershipStatus.active;
    dto.joinedAt = new Date('2026-04-01T00:00:00Z');
    dto.lastActiveAt = new Date('2026-05-19T12:00:00Z');

    expect(dto.userId).toBe('aaaa1111-aaaa-1111-aaaa-aaaa11111111');
    expect(dto.email).toBe('member@example.com');
    expect(dto.role).toBe(TenantRole.MEMBER);
    expect(dto.status).toBe(MembershipStatus.active);
    expect(dto.joinedAt).toEqual(new Date('2026-04-01T00:00:00Z'));
    expect(dto.lastActiveAt).toEqual(new Date('2026-05-19T12:00:00Z'));
  });

  it('populates all properties when constructed via plainToInstance', () => {
    const payload = {
      userId: 'aaaa1111-aaaa-1111-aaaa-aaaa11111111',
      email: 'member@example.com',
      role: TenantRole.ADMIN,
      status: MembershipStatus.invited,
      joinedAt: new Date('2026-04-01T00:00:00Z'),
      lastActiveAt: new Date('2026-05-19T12:00:00Z'),
    };
    const dto = plainToInstance(MemberResponseDto, payload);

    expect(dto).toBeInstanceOf(MemberResponseDto);
    expect(dto.userId).toBe(payload.userId);
    expect(dto.role).toBe(TenantRole.ADMIN);
    expect(dto.status).toBe(MembershipStatus.invited);
  });
});

describe('MemberListResponseDto', () => {
  it('wraps a list of MemberResponseDto with pagination metadata', () => {
    const member1 = plainToInstance(MemberResponseDto, {
      userId: 'aaaa1111-aaaa-1111-aaaa-aaaa11111111',
      email: 'a@example.com',
      role: TenantRole.OWNER,
      status: MembershipStatus.active,
      joinedAt: new Date('2026-04-01T00:00:00Z'),
      lastActiveAt: new Date('2026-05-19T00:00:00Z'),
    });
    const member2 = plainToInstance(MemberResponseDto, {
      userId: 'bbbb2222-bbbb-2222-bbbb-bbbb22222222',
      email: 'b@example.com',
      role: TenantRole.MEMBER,
      status: MembershipStatus.active,
      joinedAt: new Date('2026-04-15T00:00:00Z'),
      lastActiveAt: new Date('2026-05-18T00:00:00Z'),
    });

    const list = new MemberListResponseDto();
    list.data = [member1, member2];
    list.page = 1;
    list.pageSize = 20;
    list.total = 2;

    expect(list.data).toHaveLength(2);
    expect(list.data[0]).toBeInstanceOf(MemberResponseDto);
    expect(list.page).toBe(1);
    expect(list.pageSize).toBe(20);
    expect(list.total).toBe(2);
  });
});
