import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Max, Min } from 'class-validator';

export class BlockLayoutDto {
  @ApiProperty()
  @IsInt()
  @Min(1)
  row: number;

  @ApiProperty()
  @IsInt()
  @Min(1)
  @Max(2)
  col: number;

  @ApiProperty()
  @IsInt()
  @Min(1)
  @Max(2)
  span: number;
}
