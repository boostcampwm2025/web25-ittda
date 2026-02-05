// src/modules/feed/dto/get-feed.query.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class GetFeedQueryDto {
  /**
   * - 홈에서 “해당 날짜 기준” 피드 조회 용도
   */
  @ApiProperty({
    description: 'YYYY-MM-DD 형식의 날짜',
    example: '2026-01-28',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date must be YYYY-MM-DD' })
  date: string;

  @ApiPropertyOptional({
    description:
      '타임존 (예: Asia/Seoul). 미지정 시 서버 기본 타임존 사용 (KST)',
    example: 'Asia/Seoul',
  })
  @IsString()
  @IsOptional()
  tz?: string;
}
