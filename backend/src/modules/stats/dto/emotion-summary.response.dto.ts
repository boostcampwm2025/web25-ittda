import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class EmotionSummaryResponseDto {
  @ApiProperty({ description: '감정 종류', example: '행복' })
  @Expose()
  emotion: string;

  @ApiProperty({ description: '해당 감정 기록 횟수', example: 5 })
  @Expose()
  count: number;
}
