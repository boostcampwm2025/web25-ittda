import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class MonthRecordResponseDto {
  @ApiProperty({ description: '월 (YYYY-MM 형식)', example: '2026-01' })
  @Expose()
  month: string; // "YYYY-MM"

  @ApiProperty({ description: '해당 월의 전체 기록 수', example: 10 })
  @Expose()
  count: number;

  @ApiProperty({
    description: '커버 이미지 Asset ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    nullable: true,
  })
  @Expose()
  coverAssetId: string | null;

  @ApiProperty({ description: '최신 기록 제목', example: '오늘의 일기' })
  @Expose()
  latestTitle: string;

  @ApiProperty({
    description: '최신 기록 위치 (장소명)',
    example: '관악산',
    nullable: true,
  })
  @Expose()
  latestLocation: string | null;
}
