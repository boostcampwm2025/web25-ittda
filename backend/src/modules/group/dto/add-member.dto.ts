import { IsUUID, IsEnum } from 'class-validator';
import { GroupRoleEnum } from '@/enums/group-role.enum';

export class AddMemberDto {
  @IsUUID()
  userId: string;

  @IsEnum([GroupRoleEnum.ADMIN, GroupRoleEnum.EDITOR], {
    message: 'ADMIN 또는 EDITOR 권한만 부여할 수 있습니다.',
  })
  role: GroupRoleEnum;
}
