import { IsInt, IsUUID, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreatePostDto } from './create-post.dto';

export class PublishDraftDto {
  @IsUUID()
  draftId: string;

  @IsInt()
  @Min(0)
  draftVersion: number;

  @ValidateNested()
  @Type(() => CreatePostDto)
  post: CreatePostDto;
}
