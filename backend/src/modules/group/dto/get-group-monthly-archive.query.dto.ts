import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min, IsEnum } from 'class-validator';

export enum GroupArchiveSortEnum {
  LATEST = 'latest',
  OLDEST = 'oldest',
  MOST_RECORDS = 'mostRecords',
}

export class GetGroupMonthlyArchiveQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1500)
  @Max(3000)
  @IsOptional()
  year?: number;

  @IsEnum(GroupArchiveSortEnum, {
    message: 'sort must be one of: latest, oldest, mostRecords',
  })
  @IsOptional()
  sort?: GroupArchiveSortEnum;
}
