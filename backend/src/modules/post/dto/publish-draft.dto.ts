import { IsInt, IsUUID, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PublishDraftDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  draftId: string;

  @ApiProperty({ example: 0 })
  @IsInt()
  @Min(0)
  draftVersion: number;
}
