import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class DayRecordResponseDto {
  @ApiProperty({ description: '날짜 (YYYY-MM-DD 형식)', example: '2026-01-15' })
  @Expose()
  date: string; // "YYYY-MM-DD"

  @ApiProperty({ description: '해당 일의 전체 기록 수', example: 2 })
  @Expose()
  postCount: number;

  @ApiProperty({
    description: '커버 이미지 Asset ID',
    example: '888e4567-e89b-12d3-a456-426614174000',
    nullable: true,
  })
  @Expose()
  coverAssetId: string | null;

  @ApiProperty({ description: '최신 기록 제목', example: '맛있는 점심' })
  @Expose()
  latestPostTitle: string;

  @ApiProperty({
    description: '최신 기록 위치 (장소명)',
    example: '마루아라',
    nullable: true,
  })
  @Expose()
  latestPlaceName: string | null;
}
