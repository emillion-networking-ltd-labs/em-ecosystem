import { IsArray, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SetRolePermissionsDto {
  @ApiProperty({
    description: 'Array of permission keys to assign to the role',
    example: ['dashboard:read', 'users:read', 'users:write'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  permissionKeys: string[];
}
