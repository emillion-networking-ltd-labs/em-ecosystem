import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ChangeEmailDto } from '../dto/change-email.dto';

describe('ChangeEmailDto', () => {
  it('accepts a valid email + password', async () => {
    const dto = plainToInstance(ChangeEmailDto, {
      newEmail: 'user@example.com',
      password: 'correcthorse',
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('rejects a malformed email', async () => {
    const dto = plainToInstance(ChangeEmailDto, {
      newEmail: 'not-an-email',
      password: 'correcthorse',
    });
    const errors = await validate(dto);
    const emailError = errors.find((e) => e.property === 'newEmail');
    expect(emailError?.constraints).toHaveProperty('isEmail');
  });

  it('rejects a password shorter than 8 characters', async () => {
    const dto = plainToInstance(ChangeEmailDto, {
      newEmail: 'user@example.com',
      password: 'short1',
    });
    const errors = await validate(dto);
    const passwordError = errors.find((e) => e.property === 'password');
    expect(passwordError?.constraints).toHaveProperty('minLength');
  });

  it('rejects a password longer than 128 characters', async () => {
    const dto = plainToInstance(ChangeEmailDto, {
      newEmail: 'user@example.com',
      password: 'x'.repeat(129),
    });
    const errors = await validate(dto);
    const passwordError = errors.find((e) => e.property === 'password');
    expect(passwordError?.constraints).toHaveProperty('maxLength');
  });
});
