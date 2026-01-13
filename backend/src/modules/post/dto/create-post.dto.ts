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
import { PostScope } from '@/enums/post-scope.enum';
import { PostBlockType } from '@/enums/post-block-type.enum';
import { BlockValueMap } from '@/modules/post/types/post-block.types';

class LayoutDto {
  @IsInt() @Min(1) row: number;
  @IsInt() @Min(1) @Max(2) col: number;
  @IsInt() @Min(1) @Max(2) span: number;
}

export class BlockDto {
  @IsEnum(PostBlockType)
  type: PostBlockType;

  value: BlockValueMap[PostBlockType];

  @ValidateNested()
  @Type(() => LayoutDto)
  layout: LayoutDto;
}

export class CreatePostDto {
  @IsEnum(PostScope)
  scope: PostScope;

  @IsOptional()
  @IsUUID()
  groupId?: string;

  @IsString()
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsUUID()
  thumbnailMediaId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BlockDto)
  blocks: BlockDto[];
}
