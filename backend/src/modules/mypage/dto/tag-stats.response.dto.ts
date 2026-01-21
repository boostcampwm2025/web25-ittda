import { Expose, Type } from 'class-transformer';

export class TagCountDto {
  @Expose()
  tag: string;

  @Expose()
  count: number;
}

export class TagStatsResponseDto {
  @Expose()
  recentTop: string[];

  @Expose()
  @Type(() => TagCountDto)
  allTimeTop: TagCountDto[];
}
