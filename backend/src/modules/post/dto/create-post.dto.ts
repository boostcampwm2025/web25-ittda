import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
  IsNumber,
  IsUUID,
  IsArray,
  ArrayMaxSize,
  Min,
  Max,
  IsInt,
  IsISO8601,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PostScope } from '@/enums/post-scope.enum';
import { PostBlockType } from '@/enums/post-block-type.enum';

class LayoutDto {
  @IsInt() @Min(1) row: number;
  @IsInt() @Min(1) @Max(2) col: number;
  @IsInt() @Min(1) @Max(2) span: number;
}

class BlockDto {
  @IsEnum(PostBlockType)
  type: PostBlockType;

  // value는 타입별 json -> v1은 Record<string, any>로 받고 서비스에서 검증
  value: Record<string, any>;

  @ValidateNested()
  @Type(() => LayoutDto)
  layout: LayoutDto;
}

class LocationDto {
  @IsNumber()
  lat: number;

  @IsNumber()
  lng: number;

  @IsString()
  @MaxLength(200)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  placeName?: string;
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
  @ValidateNested()
  @Type(() => LocationDto)
  location?: LocationDto;

  @IsISO8601()
  eventAt: string; // ISO string으로 받고 Date로 변환

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  rating?: number;

  @IsOptional()
  @IsUUID()
  thumbnailMediaId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BlockDto)
  blocks: BlockDto[];
}
