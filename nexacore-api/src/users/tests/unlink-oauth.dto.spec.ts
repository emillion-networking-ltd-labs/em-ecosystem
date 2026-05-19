import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UnlinkOAuthDto } from '../dto/unlink-oauth.dto';

describe('UnlinkOAuthDto', () => {
  it('accepts a valid password', async () => {
    const dto = plainToInstance(UnlinkOAuthDto, {
      password: 'correcthorse',
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('rejects a missing password (field is required, no @IsOptional)', async () => {
    const dto = plainToInstance(UnlinkOAuthDto, {});
    const errors = await validate(dto);
    const error = errors.find((e) => e.property === 'password');
    expect(error).toBeDefined();
    expect(error?.constraints).toHaveProperty('isString');
  });

  it('rejects a password shorter than 8 characters', async () => {
    const dto = plainToInstance(UnlinkOAuthDto, { password: 'short1' });
    const errors = await validate(dto);
    const error = errors.find((e) => e.property === 'password');
    expect(error?.constraints).toHaveProperty('minLength');
  });

  it('rejects a password longer than 128 characters', async () => {
    const dto = plainToInstance(UnlinkOAuthDto, {
      password: 'x'.repeat(129),
    });
    const errors = await validate(dto);
    const error = errors.find((e) => e.property === 'password');
    expect(error?.constraints).toHaveProperty('maxLength');
  });
});
