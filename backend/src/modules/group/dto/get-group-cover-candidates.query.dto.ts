import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';

export class GetGroupCoverCandidatesQueryDto {
  @ApiProperty({
    description: 'YYYY-mm 형식의 월',
    example: '2026-01',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}$/, { message: 'month must be YYYY-mm format' })
  month: string;

  @ApiProperty({
    description: '페이지네이션 커서 (Base64 인코딩)',
    required: false,
    example: 'MTcwNjQyODgwMDAwMF91dWlk',
  })
  @IsString()
  @IsOptional()
  cursor?: string;

  @ApiProperty({ description: '페이지당 개수', default: 20, required: false })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 20;
}
