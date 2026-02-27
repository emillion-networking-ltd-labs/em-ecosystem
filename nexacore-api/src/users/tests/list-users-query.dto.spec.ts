import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ListUsersQueryDto } from '../dto/list-users-query.dto';

describe('ListUsersQueryDto', () => {
  it('should transform string page and limit to numbers via @Type', () => {
    const dto = plainToInstance(ListUsersQueryDto, {
      page: '3',
      limit: '50',
    });

    expect(dto.page).toBe(3);
    expect(typeof dto.page).toBe('number');
    expect(dto.limit).toBe(50);
    expect(typeof dto.limit).toBe('number');
  });

  it('should pass validation with valid data', async () => {
    const dto = plainToInstance(ListUsersQueryDto, {
      page: 1,
      limit: 10,
      sortBy: 'email',
      sortOrder: 'asc',
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });
});
