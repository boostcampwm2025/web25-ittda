import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Matches, Min } from 'class-validator';

export class GetGroupCoverCandidatesQueryDto {
  @ApiProperty({
    description: '조회할 월 (YYYY-MM 형식)',
    example: '2026-01',
    required: true,
  })
  @IsString()
  @Matches(/^\d{4}-\d{2}$/, { message: 'month must be in YYYY-MM format' })
  month: string;

  @ApiProperty({
    description: '페이지네이션 커서 (Base64 encoded eventAt key)',
    required: false,
  })
  @IsOptional()
  @IsString()
  cursor?: string;
  /**
   * 커서 예시:
   *
   * - 마지막 조회한 post의 eventAt(없으면 createdAt)을 getTime()으로 변환한 값과 id를 합칩니다.
   *   https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Global_Objects/Date/getTime
   *   예: 1768478400000__12345
   *
   * - 이 문자열을 UTF-8 → Base64로 인코딩합니다.
   *   예: "1768478400000__12345" → "MTc2ODQ3ODQwMDAwMF9fMTIzNDU="
   *
   * 따라서 다음 요청 시 Query 파라미터는:
   *   ?month=2026-01&cursor=MTc2ODQ3ODQwMDAwMF9fMTIzNDU=&limit=20
   *
   * 첫 페이지 조회 시에는 cursor를 생략하고,
   * 응답의 pageInfo.nextCursor 값을 그대로 다음 요청에 cursor로 전달하면 됩니다.
   */

  @ApiProperty({
    description: '한 번에 조회할 개수 (Default: 20)',
    required: false,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}

export class CoverCandidateItemDto {
  @ApiProperty({ description: '미디어 ID (PostMedia ID)' })
  mediaId: string;

  @ApiProperty({ description: '원본 Asset ID (MediaAsset ID)' })
  assetId: string;

  @ApiProperty({ description: '게시글 ID' })
  postId: string;

  @ApiProperty({ description: '게시글 제목' })
  postTitle: string;

  @ApiProperty({ description: '이벤트 일시' })
  eventAt: Date;

  @ApiProperty({ description: '이미지 너비', required: false })
  width?: number;

  @ApiProperty({ description: '이미지 높이', required: false })
  height?: number;

  @ApiProperty({ description: 'MIME 타입', required: false })
  mimeType?: string;
}

export class CoverSectionDto {
  @ApiProperty({ description: '날짜 (YYYY-MM-DD)' })
  date: string;

  @ApiProperty({ type: [CoverCandidateItemDto] })
  items: CoverCandidateItemDto[];
}

class PageInfoDto {
  @ApiProperty({ description: '다음 페이지 존재 여부' })
  hasNext: boolean;

  @ApiProperty({
    description: '다음 페이지 커서 (없으면 null)',
    nullable: true,
  })
  nextCursor: string | null;
}

export class GetGroupCoverCandidatesResponseDto {
  @ApiProperty({ description: '그룹 ID' })
  groupId: string;

  @ApiProperty({ type: [CoverSectionDto] })
  sections: CoverSectionDto[];

  @ApiProperty({ type: PageInfoDto })
  pageInfo: PageInfoDto;
}
