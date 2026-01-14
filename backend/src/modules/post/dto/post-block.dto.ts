import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { PostBlockType } from '@/enums/post-block-type.enum';
import { BlockValueMap } from '@/modules/post/types/post-block.types';
import { BlockLayoutDto } from './block-layout.dto';

export class PostBlockDto {
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
