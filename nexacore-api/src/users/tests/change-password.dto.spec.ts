import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ChangePasswordDto } from '../dto/change-password.dto';

describe('ChangePasswordDto', () => {
  it('accepts a payload with only newPassword (currentPassword is optional)', async () => {
    const dto = plainToInstance(ChangePasswordDto, {
      newPassword: 'newpass123',
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('accepts both currentPassword and newPassword', async () => {
    const dto = plainToInstance(ChangePasswordDto, {
      currentPassword: 'oldpass',
      newPassword: 'newpass123',
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('rejects a non-string newPassword', async () => {
    const dto = plainToInstance(ChangePasswordDto, {
      newPassword: 12345678,
    });
    const errors = await validate(dto);
    const error = errors.find((e) => e.property === 'newPassword');
    expect(error?.constraints).toHaveProperty('isString');
  });

  it('rejects a newPassword shorter than 8 characters', async () => {
    const dto = plainToInstance(ChangePasswordDto, {
      newPassword: 'short',
    });
    const errors = await validate(dto);
    const error = errors.find((e) => e.property === 'newPassword');
    expect(error?.constraints).toHaveProperty('minLength');
  });

  it('rejects a newPassword longer than 128 characters', async () => {
    const dto = plainToInstance(ChangePasswordDto, {
      newPassword: 'x'.repeat(129),
    });
    const errors = await validate(dto);
    const error = errors.find((e) => e.property === 'newPassword');
    expect(error?.constraints).toHaveProperty('maxLength');
  });
});
