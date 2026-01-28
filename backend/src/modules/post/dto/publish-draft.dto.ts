import { IsInt, IsUUID, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { CreatePostDto } from './create-post.dto';

export class PublishDraftDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  draftId: string;

  @ApiProperty({ example: 0 })
  @IsInt()
  @Min(0)
  draftVersion: number;

  @ApiProperty({ type: () => CreatePostDto })
  @ValidateNested()
  @Type(() => CreatePostDto)
  post: CreatePostDto;
}
