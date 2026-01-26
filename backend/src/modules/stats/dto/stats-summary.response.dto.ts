import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class StatsSummaryResponseDto {
  @ApiProperty({ description: '기록(게시글) 수', example: 10 })
  @Expose()
  count: number;
}
