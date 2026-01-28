import { ApiProperty } from '@nestjs/swagger';
import { GroupRoleEnum } from '@/enums/group-role.enum';

class GroupProfileImageDto {
  @ApiProperty({ description: '프로필 이미지 Asset ID' })
  assetId: string;
}

class GroupSettingCoverDto {
  @ApiProperty({ description: 'Asset ID' })
  assetId: string;

  @ApiProperty({ description: 'Source Post ID' })
  sourcePostId: string;
}

export class GroupSettingInfoDto {
  @ApiProperty({ description: '그룹 ID' })
  groupId: string;

  @ApiProperty({ description: '그룹 이름' })
  name: string;

  @ApiProperty({ description: '생성 일시' })
  createdAt: Date;

  @ApiProperty({ description: '방장 유저 ID' })
  ownerUserId: string;

  @ApiProperty({
    description: '커버 이미지 정보',
    type: GroupSettingCoverDto,
    nullable: true,
  })
  cover: GroupSettingCoverDto | null;
}

export class GroupSettingMemberDto {
  @ApiProperty({ description: '유저 ID' })
  userId: string;

  @ApiProperty({ description: '닉네임' })
  name: string;

  @ApiProperty({
    description: '프로필 이미지',
    type: GroupProfileImageDto,
    nullable: true,
  })
  profileImage: GroupProfileImageDto | null;

  @ApiProperty({ description: '그룹 내 역할', enum: GroupRoleEnum })
  role: GroupRoleEnum;

  @ApiProperty({ description: '그룹 내 닉네임' })
  nicknameInGroup: string | null | undefined;

  @ApiProperty({ description: '가입 일시' })
  joinedAt: Date;
}

export class GetGroupSettingsResponseDto {
  @ApiProperty({ description: '그룹 정보', type: GroupSettingInfoDto })
  group: GroupSettingInfoDto;

  @ApiProperty({ description: '내 정보', type: GroupSettingMemberDto })
  me: GroupSettingMemberDto;

  @ApiProperty({
    description: '전체 멤버 목록 (나 포함)',
    type: [GroupSettingMemberDto],
  })
  members: GroupSettingMemberDto[];
}
