import { ApiProperty } from '@nestjs/swagger';
import { GroupRoleEnum } from '@/enums/group-role.enum';

class GroupMemberCoverDto {
  @ApiProperty({ description: '에셋 ID', example: 'asset_cover_001' })
  assetId: string;
}

export class GetGroupMemberMeResponseDto {
  @ApiProperty({ description: '그룹 ID' })
  groupId: string;

  @ApiProperty({ description: '유저 ID' })
  userId: string;

  @ApiProperty({ description: '유저 글로벌 닉네임' })
  name: string;

  @ApiProperty({ description: '그룹 내 닉네임' })
  nicknameInGroup: string;

  @ApiProperty({
    description: '커버 이미지 정보 (프로필 이미지)',
    type: GroupMemberCoverDto,
    nullable: true,
  })
  cover: GroupMemberCoverDto | null;

  @ApiProperty({ description: '그룹 내 역할', enum: GroupRoleEnum })
  role: GroupRoleEnum;

  @ApiProperty({ description: '수정 일시' })
  updatedAt: Date;
}
