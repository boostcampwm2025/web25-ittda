import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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

  @ApiPropertyOptional({ example: 1200 })
  @IsOptional()
  @IsInt()
  @Min(1)
  width?: number;

  @ApiPropertyOptional({ example: 800 })
  @IsOptional()
  @IsInt()
  @Min(1)
  height?: number;
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

export class MediaCompleteRequestDto {
  @ApiProperty({ type: [String], format: 'uuid' })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  mediaIds: string[];
}

export class MediaCompleteFailureDto {
  @ApiProperty({ format: 'uuid' })
  mediaId: string;

  @ApiProperty({
    enum: ['NOT_FOUND', 'FORBIDDEN', 'NOT_FOUND_IN_STORAGE', 'HEAD_FAILED'],
  })
  reason: 'NOT_FOUND' | 'FORBIDDEN' | 'NOT_FOUND_IN_STORAGE' | 'HEAD_FAILED';
}

export class MediaCompleteResponseDto {
  @ApiProperty({ type: [String], format: 'uuid' })
  successIds: string[];

  @ApiProperty({ type: [MediaCompleteFailureDto] })
  failed: MediaCompleteFailureDto[];
}

export class MediaResolveRequestDto {
  @ApiProperty({ type: [String], format: 'uuid' })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  mediaIds: string[];

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  draftId?: string;
}

export class MediaResolveItemDto {
  @ApiProperty({ format: 'uuid' })
  mediaId: string;

  @ApiProperty()
  url: string;

  @ApiProperty({ example: '2026-01-27T12:34:56.000Z' })
  expiresAt: string;
}

export class MediaResolveFailureDto {
  @ApiProperty({ format: 'uuid' })
  mediaId: string;

  @ApiProperty({
    enum: ['NOT_FOUND', 'FORBIDDEN', 'NOT_READY'],
  })
  reason: 'NOT_FOUND' | 'FORBIDDEN' | 'NOT_READY';
}

export class MediaResolveResponseDto {
  @ApiProperty({ type: [MediaResolveItemDto] })
  items: MediaResolveItemDto[];

  @ApiProperty({ type: [MediaResolveFailureDto] })
  failed: MediaResolveFailureDto[];
}

export class MediaResolveSingleResponseDto {
  @ApiProperty()
  url: string;

  @ApiProperty({ example: '2026-01-27T12:34:56.000Z' })
  expiresAt: string;
}
