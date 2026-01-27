import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PresignFileRequestDto {
  @ApiProperty({ example: 'image/png' })
  @IsString()
  @IsNotEmpty()
  contentType: string;

  @ApiProperty({ required: false, example: 1024 })
  @IsOptional()
  @IsInt()
  @Min(1)
  size?: number;
}

export class MediaPresignRequestDto {
  @ApiProperty({ type: [PresignFileRequestDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PresignFileRequestDto)
  files: PresignFileRequestDto[];
}

export class MediaPresignItemDto {
  @ApiProperty({ format: 'uuid' })
  mediaId: string;

  @ApiProperty({ example: 'PUT' })
  method: 'PUT';

  @ApiProperty()
  uploadUrl: string;

  @ApiProperty({ example: '2026-01-27T12:34:56.000Z' })
  expiresAt: string;
}

export class MediaPresignResponseDto {
  @ApiProperty({ type: [MediaPresignItemDto] })
  items: MediaPresignItemDto[];
}
