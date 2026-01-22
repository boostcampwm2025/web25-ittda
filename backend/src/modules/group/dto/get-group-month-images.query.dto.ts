import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class GetGroupMonthImagesQueryDto {
  @ApiProperty({
    description: 'YYYY-MM 형식의 월 (파라미터명은 year이지만 YYYY-MM 형식)',
    example: '2026-01',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}$/, { message: 'year must be YYYY-MM format' })
  year: string;
}
