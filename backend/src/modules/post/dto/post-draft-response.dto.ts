import { ApiProperty } from '@nestjs/swagger';
import { CreatePostDto } from './create-post.dto';

export class DraftEntryResponseDto {
  @ApiProperty({ example: '/groups/{groupId}/posts/{draftId}/edit' })
  url: string;
}

export class DraftSnapshotResponseDto {
  @ApiProperty({ type: () => CreatePostDto })
  snapshot: CreatePostDto;

  @ApiProperty({ example: 0 })
  version: number;

  @ApiProperty({ format: 'uuid' })
  ownerActorId: string;
}
