import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { AcceptInvitationDto } from '../dto/accept-invitation.dto';
import { CreateInvitationDto } from '../dto/create-invitation.dto';

describe('Invitation DTOs', () => {
  describe('CreateInvitationDto', () => {
    it('accepts valid input with default expiresInDays', async () => {
      const dto = plainToInstance(CreateInvitationDto, {
        email: 'alice@acme.com',
        role: 'MEMBER',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('accepts explicit expiresInDays within bounds', async () => {
      const dto = plainToInstance(CreateInvitationDto, {
        email: 'bob@acme.com',
        role: 'ADMIN',
        expiresInDays: 14,
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('rejects missing email', async () => {
      const dto = plainToInstance(CreateInvitationDto, { role: 'MEMBER' });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'email')).toBe(true);
    });

    it('rejects malformed email', async () => {
      const dto = plainToInstance(CreateInvitationDto, {
        email: 'not-an-email',
        role: 'MEMBER',
      });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'email')).toBe(true);
    });

    it('rejects invalid role', async () => {
      const dto = plainToInstance(CreateInvitationDto, {
        email: 'alice@acme.com',
        role: 'NOT_A_ROLE',
      });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'role')).toBe(true);
    });

    it('rejects expiresInDays < 1', async () => {
      const dto = plainToInstance(CreateInvitationDto, {
        email: 'alice@acme.com',
        role: 'MEMBER',
        expiresInDays: 0,
      });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'expiresInDays')).toBe(true);
    });

    it('rejects expiresInDays > 30', async () => {
      const dto = plainToInstance(CreateInvitationDto, {
        email: 'alice@acme.com',
        role: 'MEMBER',
        expiresInDays: 31,
      });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'expiresInDays')).toBe(true);
    });
  });

  describe('AcceptInvitationDto', () => {
    it('accepts a 43-char base64url-like token (canonical)', async () => {
      const dto = plainToInstance(AcceptInvitationDto, {
        token: 'a'.repeat(43),
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('rejects too-short token', async () => {
      const dto = plainToInstance(AcceptInvitationDto, {
        token: 'short',
      });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'token')).toBe(true);
    });

    it('rejects too-long token', async () => {
      const dto = plainToInstance(AcceptInvitationDto, {
        token: 'a'.repeat(65),
      });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'token')).toBe(true);
    });
  });
});
