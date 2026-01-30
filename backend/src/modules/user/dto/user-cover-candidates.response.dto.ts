import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserCoverCandidateItemDto {
  @ApiProperty({ description: 'Media Asset ID', example: 'uuid' })
  mediaId: string;

  @ApiProperty({ description: '게시글 ID', example: 'uuid' })
  postId: string;

  @ApiProperty({ description: '게시글 제목', example: '부산 여행 1일차' })
  postTitle: string;

  @ApiProperty({ description: '기록 일시', example: '2026-01-14T18:30:00Z' })
  eventAt: Date;

  @ApiPropertyOptional({ description: '이미지 너비', example: 1080 })
  width?: number;

  @ApiPropertyOptional({ description: '이미지 높이', example: 1350 })
  height?: number;

  @ApiPropertyOptional({ description: 'MIME 타입', example: 'image/jpeg' })
  mimeType?: string;
}

export class UserCoverCandidateSectionDto {
  @ApiProperty({ description: '날짜', example: '2026-01-14' })
  date: string;

  @ApiProperty({ type: [UserCoverCandidateItemDto] })
  items: UserCoverCandidateItemDto[];
}

export class UserCoverPageInfoDto {
  @ApiProperty({ description: '다음 페이지 존재 여부', example: false })
  hasNext: boolean;

  @ApiProperty({
    description: '다음 페이지 커서',
    example: null,
    nullable: true,
  })
  nextCursor: string | null;
}

export class UserCoverCandidatesResponseDto {
  @ApiProperty({ description: '사용자 ID', example: 'user_123456' })
  userId: string;

  @ApiProperty({ type: [UserCoverCandidateSectionDto] })
  sections: UserCoverCandidateSectionDto[];

  @ApiProperty({ type: UserCoverPageInfoDto })
  pageInfo: UserCoverPageInfoDto;
}
