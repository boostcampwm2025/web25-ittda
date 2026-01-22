import { IsUUID, IsEnum } from 'class-validator';
import { GroupRoleEnum } from '@/enums/group-role.enum';
import { ApiProperty } from '@nestjs/swagger';

export class AddMemberDto {
  @ApiProperty({
    description: '초대할 유저의 ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  userId: string;

  @ApiProperty({
    description: '부여할 권한 (ADMIN 또는 EDITOR)',
    enum: [GroupRoleEnum.ADMIN, GroupRoleEnum.EDITOR],
    example: GroupRoleEnum.EDITOR,
  })
  @IsEnum([GroupRoleEnum.ADMIN, GroupRoleEnum.EDITOR], {
    message: 'ADMIN 또는 EDITOR 권한만 부여할 수 있습니다.',
  })
  role: GroupRoleEnum;
}
