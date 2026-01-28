import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min, IsEnum, IsString } from 'class-validator';
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

  @ApiProperty({ description: '페이지네이션 커서 (YYYY-MM)', required: false })
  @IsString()
  @IsOptional()
  cursor?: string;

  @ApiProperty({ description: '페이지당 개수', default: 12, required: false })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 12;
}
