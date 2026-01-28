import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class GroupMonthCoverCandidateResponseDto {
  @ApiProperty({ description: 'Media Asset ID' })
  @Expose()
  assetId: string;

  @ApiProperty({ description: '게시글 ID' })
  @Expose()
  sourcePostId: string;

  @ApiProperty({ description: '기록 일시' })
  @Expose()
  eventAt: Date;
}

export class PaginatedGroupMonthCoverCandidateResponseDto {
  @ApiProperty({ type: [GroupMonthCoverCandidateResponseDto] })
  items: GroupMonthCoverCandidateResponseDto[];

  @ApiProperty({
    description: '다음 페이지 커서 (eventAt_ID)',
    nullable: true,
  })
  nextCursor: string | null;
}
