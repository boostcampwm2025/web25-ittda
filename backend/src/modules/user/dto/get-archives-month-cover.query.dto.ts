import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, Min } from 'class-validator';

export class GetArchivesMonthCoverQueryDto {
  @ApiProperty({
    description: '조회할 연도 (YYYY)',
    example: 2025,
  })
  @Type(() => Number)
  @IsInt()
  @IsNotEmpty()
  @Min(1500)
  year: number;
}
