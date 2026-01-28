import { ApiProperty } from '@nestjs/swagger';

export class GroupCoverDto {
  @ApiProperty({ description: '커버 이미지 Asset ID' })
  assetId: string;

  @ApiProperty({ description: '이미지 너비' })
  width: number;

  @ApiProperty({ description: '이미지 높이' })
  height: number;

  @ApiProperty({ description: 'MIME 타입' })
  mimeType: string;
}

export class GroupLatestPostDto {
  @ApiProperty({ description: '게시글 ID' })
  postId: string;

  @ApiProperty({ description: '게시글 제목' })
  title: string;

  @ApiProperty({ description: '이벤트 시간', type: Date })
  eventAt: Date;

  @ApiProperty({ description: '장소명', nullable: true })
  placeName: string | null;
}

export class GroupItemDto {
  @ApiProperty({ description: '그룹 ID' })
  groupId: string;

  @ApiProperty({ description: '그룹 이름' })
  name: string;

  @ApiProperty({
    description: '그룹 커버 이미지',
    type: GroupCoverDto,
    nullable: true,
  })
  cover: GroupCoverDto | null;

  @ApiProperty({ description: '멤버 수' })
  memberCount: number;

  @ApiProperty({ description: '기록 수' })
  recordCount: number;

  @ApiProperty({ description: '생성 일시' })
  createdAt: Date;

  @ApiProperty({ description: '최근 활동 일시', nullable: true })
  lastActivityAt: Date | null;

  @ApiProperty({
    description: '최근 게시글 정보',
    type: GroupLatestPostDto,
    nullable: true,
  })
  latestPost: GroupLatestPostDto | null;
}

export class GetGroupsResponseDto {
  @ApiProperty({ description: '그룹 목록', type: [GroupItemDto] })
  items: GroupItemDto[];
}
