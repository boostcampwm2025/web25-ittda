import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class GroupDayRecordResponseDto {
  @ApiProperty({
    description: '날짜 (YYYY-MM-DD 형식)',
    example: '2026-01-15',
  })
  @Expose()
  date: string;

  @ApiProperty({
    description: '해당 일의 전체 기록 수',
    example: 3,
  })
  @Expose()
  postCount: number;

  @ApiProperty({
    description: '커버 썸네일 이미지 ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    nullable: true,
  })
  @Expose()
  coverThumbnailId: string | null;

  @ApiProperty({
    description: '최신 기록 제목',
    example: '제주도 여행 첫째 날',
  })
  @Expose()
  latestPostTitle: string;

  @ApiProperty({
    description: '최신 기록 위치 (장소명)',
    example: '제주 국제공항',
    nullable: true,
  })
  @Expose()
  latestPlaceName: string | null;
}
