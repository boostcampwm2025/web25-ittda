import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsNumber,
  IsString,
  IsDateString,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class MapPostsQueryDto {
  @ApiProperty({ description: '중심 위도' })
  @IsNumber()
  @Type(() => Number)
  lat: number;

  @ApiProperty({ description: '중심 경도' })
  @IsNumber()
  @Type(() => Number)
  lng: number;

  @ApiPropertyOptional({ description: '반경 (미터)', default: 1000 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  radius?: number = 1000;

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

  @ApiPropertyOptional({ description: '썸네일 URL' })
  thumbnailUrl?: string;

  @ApiProperty({ description: '생성일/이벤트일' })
  createdAt: Date;

  @ApiProperty({ type: [String], description: '태그 목록' })
  tags: string[];

  @ApiPropertyOptional({ description: '장소명' })
  placeName?: string;
}

export class PaginatedMapPostsResponseDto {
  @ApiProperty({ type: [MapPostItemDto] })
  items: MapPostItemDto[];

  @ApiPropertyOptional({ description: '다음 페이지용 커서' })
  nextCursor?: string;
}
