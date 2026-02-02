import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsNumber,
  IsString,
  IsDateString,
  IsEnum,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PostMood } from '@/enums/post-mood.enum';

export enum MapScope {
  PERSONAL = 'personal',
  GROUP = 'group',
}

export class MapPostsQueryDto {
  @ApiProperty({
    enum: MapScope,
    description: '조회 범위 (personal: 내 기록, group: 그룹 기록)',
  })
  @IsEnum(MapScope)
  scope: MapScope;

  @ApiPropertyOptional({ description: '그룹 ID (scope이 group인 경우 필수)' })
  @IsOptional()
  @IsString()
  groupId?: string;

  @ApiProperty({ description: 'bbox 최소 위도' })
  @IsNumber()
  @Type(() => Number)
  minLat: number;

  @ApiProperty({ description: 'bbox 최소 경도' })
  @IsNumber()
  @Type(() => Number)
  minLng: number;

  @ApiProperty({ description: 'bbox 최대 위도' })
  @IsNumber()
  @Type(() => Number)
  maxLat: number;

  @ApiProperty({ description: 'bbox 최대 경도' })
  @IsNumber()
  @Type(() => Number)
  maxLng: number;

  @ApiPropertyOptional({ description: '시작 날짜 (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ description: '종료 날짜 (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional({
    description: '태그 목록 (쉼표 구분)',
    example: 'tag1,tag2',
  })
  @IsOptional()
  @IsString()
  tags?: string;

  @ApiPropertyOptional({
    description: '감정 목록 (쉼표 구분)',
    example: '행복,슬픔',
  })
  @IsOptional()
  @IsString()
  emotions?: string;

  @ApiPropertyOptional({ description: '페이지네이션 커서' })
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiPropertyOptional({ description: '페이지당 개수', default: 20 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export class MapPostItemDto {
  @ApiProperty({ description: '게시글 ID' })
  id: string;

  @ApiProperty({ description: '위도' })
  lat: number;

  @ApiProperty({ description: '경도' })
  lng: number;

  @ApiProperty({ description: '제목' })
  title: string;

  @ApiPropertyOptional({ description: '썸네일 미디어 ID' })
  thumbnailMediaId?: string | null;

  @ApiProperty({ description: '생성일/이벤트일' })
  createdAt: Date;

  @ApiProperty({ type: [String], description: '태그 목록' })
  tags: string[];

  @ApiPropertyOptional({ type: [String], description: '감정 목록' })
  emotion?: PostMood[] | null;

  @ApiPropertyOptional({ description: '장소명', nullable: true })
  placeName?: string | null;
}

export class PaginatedMapPostsResponseDto {
  @ApiProperty({ type: [MapPostItemDto] })
  items: MapPostItemDto[];

  @ApiProperty({ description: '다음 페이지 여부' })
  hasNextPage: boolean;

  @ApiProperty({ description: '다음 페이지용 커서', nullable: true })
  nextCursor: string | null;
}
