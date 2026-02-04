import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsArray,
  IsDateString,
  IsNumber,
  Min,
  Max,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PostMood } from '@/enums/post-mood.enum';

export class SearchPostsDto {
  @ApiPropertyOptional({ description: '검색 키워드 (제목 및 내용)' })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({ description: '시작 날짜', example: '2024-01-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: '종료 날짜', example: '2024-12-31' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: '태그 목록', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    description: '감정 목록',
    type: [String],
    example: ['행복', '슬픔'],
  })
  @IsOptional()
  @IsArray()
  @IsEnum(PostMood, { each: true })
  emotions?: PostMood[];

  @ApiPropertyOptional({ description: '위도' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  latitude?: number;

  @ApiPropertyOptional({ description: '경도' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  longitude?: number;

  @ApiPropertyOptional({ description: '반경 (km)', default: 5 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @Max(100)
  radius?: number = 5;
}

export class SearchResultItemDto {
  @ApiProperty({ description: '게시글 ID' })
  id: string;

  @ApiPropertyOptional({ description: '썸네일 미디어 ID' })
  thumbnailMediaId?: string;

  @ApiProperty({ description: '제목' })
  title: string;

  @ApiProperty({ description: '날짜' })
  eventAt: Date;

  @ApiPropertyOptional({ description: '위치 정보' })
  location?: {
    address: string;
    placeName?: string;
  };

  @ApiPropertyOptional({ description: '내용 요약 (snippet)' })
  snippet?: string;
}

export class PaginatedSearchResponseDto {
  @ApiProperty({ type: [SearchResultItemDto] })
  items: SearchResultItemDto[];

  @ApiPropertyOptional({ description: '다음 페이지용 커서' })
  nextCursor?: string;
}
export class RecentSearchKeywordsResponseDto {
  @ApiProperty({ type: [String], description: '최근 검색어 목록' })
  keywords: string[];
}

export class FrequentTagsResponseDto {
  @ApiProperty({ type: [String], description: '자주 쓰는 태그 목록' })
  tags: string[];
}
