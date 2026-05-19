import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { AdminUpdateUserDto } from '../dto/admin-update-user.dto';
import { Role } from '../enums/role.enum';

describe('AdminUpdateUserDto', () => {
  it('accepts an empty payload (both fields are @IsOptional)', async () => {
    const dto = plainToInstance(AdminUpdateUserDto, {});
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('accepts a valid role + isActive combination', async () => {
    const dto = plainToInstance(AdminUpdateUserDto, {
      role: Role.ADMIN,
      isActive: true,
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('rejects a role that is not in the Role enum', async () => {
    const dto = plainToInstance(AdminUpdateUserDto, {
      role: 'NOT_A_ROLE',
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].constraints).toHaveProperty('isEnum');
  });

  it('rejects a non-boolean isActive value', async () => {
    const dto = plainToInstance(AdminUpdateUserDto, {
      isActive: 'not-a-boolean',
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].constraints).toHaveProperty('isBoolean');
  });
});
