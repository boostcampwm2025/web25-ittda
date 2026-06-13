import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  Max,
  Min,
  IsString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum GroupArchiveSortEnum {
  LATEST = 'latest',
  OLDEST = 'oldest',
  MOST_RECORDS = 'mostRecords',
}

export class GetGroupMonthlyArchiveQueryDto {
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
    description:
      '정렬 방식 (latest: 최신순, oldest: 오래된순, mostRecords: 기록 많은순)',
    enum: GroupArchiveSortEnum,
    example: GroupArchiveSortEnum.LATEST,
    required: false,
    default: GroupArchiveSortEnum.LATEST,
  })
  @IsEnum(GroupArchiveSortEnum, {
    message: 'sort must be one of: latest, oldest, mostRecords',
  })
  @IsOptional()
  sort?: GroupArchiveSortEnum;

  @ApiProperty({
    description: '페이지네이션 커서 (Base64 인코딩)',
    required: false,
    example: 'WVlZWS1NTQ==',
  })
  @IsString()
  @IsOptional()
  cursor?: string;

  @ApiProperty({ description: '페이지당 개수', default: 12, required: false })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(60)
  @IsOptional()
  limit?: number = 12;
}
