import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetMonthlyArchiveQueryDto {
  @ApiProperty({
    description: '조회할 연도',
    example: 2026,
    required: false,
    minimum: 1500,
    maximum: 3000,
    default: new Date().getFullYear(),
  })
  @Type(() => Number)
  @IsInt()
  @Min(1500)
  @Max(3000)
  @IsOptional()
  year?: number;

  @ApiProperty({
    description: '연도 구분 없이 전체 월을 커서 기반으로 조회할지 여부',
    example: true,
    required: false,
    default: false,
  })
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  @IsOptional()
  allYears?: boolean;

  @ApiProperty({
    description: '월별 무한 스크롤용 커서 (Base64 인코딩된 YYYY-MM)',
    required: false,
    example: 'MjAyNi0wNg==',
  })
  @IsString()
  @IsOptional()
  cursor?: string;

  @ApiProperty({
    description: '한 번에 조회할 월 개수',
    required: false,
    default: 12,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(60)
  @IsOptional()
  limit?: number = 12;
}
