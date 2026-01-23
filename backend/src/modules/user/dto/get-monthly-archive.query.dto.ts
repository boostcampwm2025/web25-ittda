import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetMonthlyArchiveQueryDto {
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
}
