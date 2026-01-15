import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsObject,
  IsOptional,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PostBlockType } from '@/enums/post-block-type.enum';
import { BlockValueMap } from '@/modules/post/types/post-block.types';
import { BlockLayoutDto } from './block-layout.dto';

export class PostBlockDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiProperty({ enum: PostBlockType })
  @IsEnum(PostBlockType)
  type: PostBlockType;

  @IsObject()
  @ApiProperty()
  value: BlockValueMap[PostBlockType];

  @ApiProperty({ type: () => BlockLayoutDto })
  @ValidateNested()
  @Type(() => BlockLayoutDto)
  layout: BlockLayoutDto;
}
