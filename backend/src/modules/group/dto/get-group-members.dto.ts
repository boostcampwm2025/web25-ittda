import { ApiProperty } from '@nestjs/swagger';

export class GroupMemberResponseDto {
  @ApiProperty({
    description: '멤버 ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  memberId: string;

  @ApiProperty({
    description: '멤버 프로필 이미지 ID',
    example: '888e4567-e89b-12d3-a456-426614174000',
    nullable: true,
  })
  profileImageId?: string | null;
}

export class GetGroupMembersResponseDto {
  @ApiProperty({
    description: '그룹 이름',
    example: '부스트캠프 25조',
  })
  groupName: string;

  @ApiProperty({
    description: '그룹 총 멤버 수',
    example: 5,
  })
  groupMemberCount: number;

  @ApiProperty({
    description: '그룹 멤버 목록',
    type: [GroupMemberResponseDto],
  })
  members: GroupMemberResponseDto[];
}
