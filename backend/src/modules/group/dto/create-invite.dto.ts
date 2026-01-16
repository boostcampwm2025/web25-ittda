import { IsEnum, IsInt, Min } from 'class-validator';
import { GroupRoleEnum } from '@/enums/group-role.enum';

export class CreateInviteDto {
  @IsEnum(GroupRoleEnum)
  permission: GroupRoleEnum;

  @IsInt()
  @Min(60)
  expiresInSeconds: number;
}
