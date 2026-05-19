import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { DeleteAccountDto } from '../dto/delete-account.dto';

describe('DeleteAccountDto', () => {
  it('accepts an empty payload (password is optional)', async () => {
    const dto = plainToInstance(DeleteAccountDto, {});
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('accepts a valid password', async () => {
    const dto = plainToInstance(DeleteAccountDto, {
      password: 'correcthorse',
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('rejects a password shorter than 8 characters', async () => {
    const dto = plainToInstance(DeleteAccountDto, {
      password: 'short1',
    });
    const errors = await validate(dto);
    const error = errors.find((e) => e.property === 'password');
    expect(error?.constraints).toHaveProperty('minLength');
  });

  it('rejects a password longer than 128 characters', async () => {
    const dto = plainToInstance(DeleteAccountDto, {
      password: 'x'.repeat(129),
    });
    const errors = await validate(dto);
    const error = errors.find((e) => e.property === 'password');
    expect(error?.constraints).toHaveProperty('maxLength');
  });
});
