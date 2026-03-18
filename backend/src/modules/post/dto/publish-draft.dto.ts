import {
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class BlockValueOverrideDto {
  @IsUUID()
  id: string;

  @IsString()
  type: string;

  @IsObject()
  value: Record<string, unknown>;

  @IsObject()
  layout: Record<string, unknown>;
}

export class PublishDraftDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  draftId: string;

  @ApiProperty({ example: 0 })
  @IsInt()
  @Min(0)
  draftVersion: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  titleOverride?: string;

  @ApiPropertyOptional({
    description: '발행 시 블록 값 최종 반영 (race condition 방지)',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BlockValueOverrideDto)
  blocksOverride?: BlockValueOverrideDto[];
}
