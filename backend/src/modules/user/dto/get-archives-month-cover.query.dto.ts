import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class GetArchivesMonthCoverQueryDto {
  @ApiProperty({
    description: '조회할 연도-월 (YYYY-MM)',
    example: '2025-01',
  })
  @IsString()
  @IsNotEmpty()
  year: string;
}
