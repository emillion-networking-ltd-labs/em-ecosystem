import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateProfileDto } from '../dto/update-profile.dto';

describe('UpdateProfileDto', () => {
  it('accepts an empty payload (all 3 fields are @IsOptional)', async () => {
    const dto = plainToInstance(UpdateProfileDto, {});
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('accepts all 3 fields populated with valid values', async () => {
    const dto = plainToInstance(UpdateProfileDto, {
      firstName: 'Ana',
      lastName: 'Pérez',
      avatarUrl: 'https://cdn.example.com/a.png',
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('rejects a firstName longer than 100 characters', async () => {
    const dto = plainToInstance(UpdateProfileDto, {
      firstName: 'x'.repeat(101),
    });
    const errors = await validate(dto);
    const error = errors.find((e) => e.property === 'firstName');
    expect(error?.constraints).toHaveProperty('maxLength');
  });

  it('rejects a lastName longer than 100 characters', async () => {
    const dto = plainToInstance(UpdateProfileDto, {
      lastName: 'x'.repeat(101),
    });
    const errors = await validate(dto);
    const error = errors.find((e) => e.property === 'lastName');
    expect(error?.constraints).toHaveProperty('maxLength');
  });

  it('rejects an avatarUrl without a protocol (require_protocol=true)', async () => {
    const dto = plainToInstance(UpdateProfileDto, {
      avatarUrl: 'cdn.example.com/a.png',
    });
    const errors = await validate(dto);
    const error = errors.find((e) => e.property === 'avatarUrl');
    expect(error?.constraints).toHaveProperty('isUrl');
  });

  it('rejects an avatarUrl longer than 500 characters', async () => {
    const longUrl = 'https://example.com/' + 'x'.repeat(481);
    const dto = plainToInstance(UpdateProfileDto, { avatarUrl: longUrl });
    const errors = await validate(dto);
    const error = errors.find((e) => e.property === 'avatarUrl');
    expect(error?.constraints).toHaveProperty('maxLength');
  });
});
