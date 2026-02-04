import { ApiProperty } from '@nestjs/swagger';
import { GroupRoleEnum } from '@/enums/group-role.enum';

export class GetGroupPermissionResponseDto {
  @ApiProperty({ enum: GroupRoleEnum })
  role: GroupRoleEnum;
}
