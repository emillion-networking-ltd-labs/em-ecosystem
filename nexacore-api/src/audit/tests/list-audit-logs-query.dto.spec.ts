import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ListAuditLogsQueryDto } from '../dto/list-audit-logs-query.dto';

describe('ListAuditLogsQueryDto', () => {
  it('should transform string page and limit to numbers via @Type', () => {
    const dto = plainToInstance(ListAuditLogsQueryDto, {
      page: '2',
      limit: '25',
    });

    expect(dto.page).toBe(2);
    expect(typeof dto.page).toBe('number');
    expect(dto.limit).toBe(25);
    expect(typeof dto.limit).toBe('number');
  });

  it('should pass validation with valid data', async () => {
    const dto = plainToInstance(ListAuditLogsQueryDto, {
      page: 1,
      limit: 20,
      sortOrder: 'desc',
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });
});
