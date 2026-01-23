import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class GetDailyArchiveQueryDto {
  @ApiProperty({
    description: 'YYYY-MM 형식의 월',
    example: '2025-12',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}$/, { message: 'month must be YYYY-MM' })
  month: string;
}
