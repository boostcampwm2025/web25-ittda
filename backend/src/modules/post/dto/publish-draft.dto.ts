import { IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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
}
