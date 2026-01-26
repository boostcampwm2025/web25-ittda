import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class StatsSummaryResponseDto {
  @ApiProperty({ description: '연속 작성 일수', example: 5 })
  @Expose()
  streak: number;

  @ApiProperty({ description: '이번달 기록한 날짜 수', example: 12 })
  @Expose()
  monthlyRecordingDays: number;
}
