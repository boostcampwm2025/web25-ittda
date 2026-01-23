import { Expose, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class TagCountDto {
  @ApiProperty({ description: '태그 이름', example: '공부' })
  @Expose()
  tag: string;

  @ApiProperty({ description: '사용 횟수', example: 10 })
  @Expose()
  count: number;
}

export class TagStatsResponseDto {
  @ApiProperty({
    description: '최근 많이 사용한 태그 TOP 10',
    type: [TagCountDto],
  })
  @Expose()
  @Type(() => TagCountDto)
  recentTop: TagCountDto[];

  @ApiProperty({
    description: '누적 가장 많이 사용한 태그 TOP 10',
    type: [TagCountDto],
  })
  @Expose()
  @Type(() => TagCountDto)
  allTimeTop: TagCountDto[];
}
