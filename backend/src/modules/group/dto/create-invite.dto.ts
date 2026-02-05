import { IsEnum, IsInt, Min } from 'class-validator';
import { GroupRoleEnum } from '@/enums/group-role.enum';
import { ApiProperty } from '@nestjs/swagger';

export class CreateInviteDto {
  @ApiProperty({
    description: '초대 링크로 가입 시 부여될 권한',
    enum: GroupRoleEnum,
    example: GroupRoleEnum.EDITOR,
  })
  @IsEnum(GroupRoleEnum)
  permission: GroupRoleEnum;

  @ApiProperty({
    description: '초대 링크 유효 시간 (초 단위, 최소 60초)',
    example: 3600,
  })
  @IsInt()
  @Min(60)
  expiresInSeconds: number;
}
