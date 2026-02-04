import {
  IsArray,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
  IsOptional,
  IsUUID,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PostBlockDto } from './post-block.dto';

export class EditPostDto {
  @ApiProperty({ example: 'string' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  version: number;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  thumbnailMediaId?: string;

  @ApiProperty({
    type: () => [PostBlockDto],
    example: [
      {
        type: 'DATE',
        value: { date: '2025-01-14' },
        layout: { row: 1, col: 1, span: 1 },
      },
      {
        type: 'TIME',
        value: { time: '13:30' },
        layout: { row: 1, col: 2, span: 1 },
      },
      {
        type: 'TEXT',
        value: { text: '본문' },
        layout: { row: 2, col: 1, span: 2 },
      },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PostBlockDto)
  blocks: PostBlockDto[];
}
