// src/modules/feed/dto/get-feed.query.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { PostScope } from '@/enums/post-scope.enum';

export class GetFeedQueryDto {
  /**
   * - 홈에서 “해당 날짜 기준” 피드 조회 용도
   */
  @ApiProperty({
    description: 'YYYY-MM-DD 형식의 날짜',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date must be YYYY-MM-DD' })
  date: string;

  @ApiPropertyOptional({
    description:
      '타임존 (예: Asia/Seoul). 미지정 시 서버 기본 타임존 사용 (KST)',
  })
  @IsString()
  @IsOptional()
  tz?: string;

  @ApiPropertyOptional({
    description: '피드 범위 필터 (미지정 시 전체)',
    enum: Object.values(PostScope),
  })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toUpperCase() : undefined,
  )
  @IsIn(Object.values(PostScope), {
    message: `scope must be one of: ${Object.values(PostScope).join(', ')}`,
  })
  scope?: PostScope;
}
