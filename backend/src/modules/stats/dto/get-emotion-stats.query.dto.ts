import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Min } from 'class-validator';

export class GetEmotionStatsQueryDto {
  @ApiPropertyOptional({
    description: '정렬 기준',
    enum: ['recent', 'frequent'],
  })
  @IsOptional()
  @IsIn(['recent', 'frequent'])
  sort?: 'recent' | 'frequent';

  @ApiPropertyOptional({
    description: '가져올 감정의 개수 (미지정 시 전체 반환)',
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}
