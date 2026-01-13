import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
  IsUUID,
  IsArray,
  Min,
  Max,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PostScope } from '@/enums/post-scope.enum';
import { PostBlockType } from '@/enums/post-block-type.enum';
import { BlockValueMap } from '@/modules/post/types/post-block.types';

class LayoutDto {
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

export class BlockDto {
  @ApiProperty({ enum: PostBlockType })
  @IsEnum(PostBlockType)
  type: PostBlockType;

  @ApiProperty()
  value: BlockValueMap[PostBlockType];

  @ApiProperty({ type: () => LayoutDto })
  @ValidateNested()
  @Type(() => LayoutDto)
  layout: LayoutDto;
}

export class CreatePostDto {
  @ApiProperty({ enum: PostScope })
  @IsEnum(PostScope)
  scope: PostScope;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  groupId?: string;

  @ApiProperty()
  @IsString()
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  thumbnailMediaId?: string;

  @ApiProperty({ type: () => [BlockDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BlockDto)
  blocks: BlockDto[];
}
