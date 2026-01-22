import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class GroupMonthRecordResponseDto {
  @ApiProperty({ description: '월 (YYYY-MM 형식)', example: '2026-01' })
  @Expose()
  month: string;

  @ApiProperty({
    description: '커버 이미지 Asset ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    nullable: true,
  })
  @Expose()
  coverAssetId: string | null;

  @ApiProperty({ description: '해당 월의 전체 기록 수', example: 15 })
  @Expose()
  count: number;

  @ApiProperty({
    description: '최신 기록 제목',
    example: '제주도 여행 첫째 날',
  })
  @Expose()
  latestTitle: string;

  @ApiProperty({
    description: '최신 기록 위치 (장소명)',
    example: '제주 국제공항',
    nullable: true,
  })
  @Expose()
  latestLocation: string | null;
}
