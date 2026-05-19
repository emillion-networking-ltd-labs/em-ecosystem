import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ListSecurityActivityQueryDto } from '../dto/list-security-activity-query.dto';

describe('ListSecurityActivityQueryDto', () => {
  it('applies defaults (page=1, limit=20) when fields are omitted', async () => {
    const dto = plainToInstance(ListSecurityActivityQueryDto, {});
    expect(dto.page).toBe(1);
    expect(dto.limit).toBe(20);
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('coerces string page and limit to numbers via @Type', async () => {
    const dto = plainToInstance(ListSecurityActivityQueryDto, {
      page: '5',
      limit: '50',
    });
    expect(dto.page).toBe(5);
    expect(typeof dto.page).toBe('number');
    expect(dto.limit).toBe(50);
    expect(typeof dto.limit).toBe('number');
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('rejects page < 1 (@Min)', async () => {
    const dto = plainToInstance(ListSecurityActivityQueryDto, { page: 0 });
    const errors = await validate(dto);
    const error = errors.find((e) => e.property === 'page');
    expect(error?.constraints).toHaveProperty('min');
  });

  it('rejects limit > 100 (@Max)', async () => {
    const dto = plainToInstance(ListSecurityActivityQueryDto, { limit: 101 });
    const errors = await validate(dto);
    const error = errors.find((e) => e.property === 'limit');
    expect(error?.constraints).toHaveProperty('max');
  });

  it('rejects a non-integer page (@IsInt)', async () => {
    const dto = plainToInstance(ListSecurityActivityQueryDto, { page: 1.5 });
    const errors = await validate(dto);
    const error = errors.find((e) => e.property === 'page');
    expect(error?.constraints).toHaveProperty('isInt');
  });
});
