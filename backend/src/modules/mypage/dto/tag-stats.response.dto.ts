import { Expose, Type } from 'class-transformer';

export class TagCountDto {
  @Expose()
  tag: string;

  @Expose()
  count: number;
}

export class TagStatsResponseDto {
  @Expose()
  @Type(() => TagCountDto)
  recentTop: TagCountDto[];

  @Expose()
  @Type(() => TagCountDto)
  allTimeTop: TagCountDto[];
}
