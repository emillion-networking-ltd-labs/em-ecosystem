import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateTenantDto } from '../dto/create-tenant.dto';
import { UpdateTenantDto } from '../dto/update-tenant.dto';

/**
 * DTO validation tests — SCRUM-487 Phase 0.1.
 *
 * Exercises the class-validator decorators on CreateTenantDto and
 * UpdateTenantDto so the files are tracked by coverage (v8 provider does
 * not count decorator-only class definitions until something at runtime
 * touches the module). Also documents the validation contract for future
 * developers.
 */

describe('CreateTenantDto', () => {
  it('accepts a fully-valid payload', async () => {
    const dto = plainToInstance(CreateTenantDto, {
      slug: 'acme-corp',
      name: 'Acme Corporation',
      status: 'active',
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('accepts a payload without optional status (defaults handled in service)', async () => {
    const dto = plainToInstance(CreateTenantDto, {
      slug: 'minimal',
      name: 'Minimal',
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it.each([
    ['empty slug', { slug: '', name: 'X' }, 'slug'],
    ['uppercase slug', { slug: 'BadSlug', name: 'X' }, 'slug'],
    ['slug starts with number', { slug: '1-foo', name: 'X' }, 'slug'],
    ['slug contains spaces', { slug: 'has space', name: 'X' }, 'slug'],
    ['slug too long', { slug: 'a'.repeat(60), name: 'X' }, 'slug'],
    ['empty name', { slug: 'ok', name: '' }, 'name'],
    ['name too long', { slug: 'ok', name: 'a'.repeat(150) }, 'name'],
    [
      'invalid status enum',
      { slug: 'ok', name: 'X', status: 'banned' },
      'status',
    ],
  ])('rejects %s', async (_label, payload, propertyName) => {
    const dto = plainToInstance(CreateTenantDto, payload);
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === propertyName)).toBe(true);
  });
});

describe('UpdateTenantDto', () => {
  it('accepts an empty payload (all fields optional via PartialType)', async () => {
    const dto = plainToInstance(UpdateTenantDto, {});
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('accepts partial updates (name only)', async () => {
    const dto = plainToInstance(UpdateTenantDto, { name: 'New Name' });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('still validates fields that ARE provided (invalid slug rejected)', async () => {
    const dto = plainToInstance(UpdateTenantDto, { slug: 'BAD-SLUG' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'slug')).toBe(true);
  });
});
