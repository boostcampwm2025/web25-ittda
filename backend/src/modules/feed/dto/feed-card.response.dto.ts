import { PostBlockType } from '@/enums/post-block-type.enum';
import { BlockValueMap } from '@/modules/post/types/post-block.types';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// src/modules/feed/dto/feed-card.response.dto.ts
export const FeedScope = {
  ME: 'ME',
  GROUP: 'GROUP',
} as const;

export type FeedScope = (typeof FeedScope)[keyof typeof FeedScope];

export class FeedCardResponseDto {
  @ApiProperty({ format: 'uuid' })
  postId: string;
  @ApiProperty({ enum: FeedScope })
  scope: FeedScope;
  @ApiPropertyOptional({ format: 'uuid' })
  // 그룹 글이면 groupId, 개인 글이면 null
  groupId?: string | null;
  // 카드에 보여줄 것들(프로젝트 스펙에 맞게 수정)
  @ApiProperty()
  title: string;
  @ApiProperty()
  eventAt: Date; // ISO string
  @ApiProperty()
  createdAt: Date; // ISO string
  @ApiProperty()
  updatedAt: Date; // ISO string
  @ApiPropertyOptional()
  location: BlockValueMap[typeof PostBlockType.LOCATION] | null;
  @ApiPropertyOptional()
  tags: BlockValueMap[typeof PostBlockType.TAG] | null;
  @ApiPropertyOptional()
  rating: BlockValueMap[typeof PostBlockType.RATING] | null;
  constructor(init: FeedCardResponseDto) {
    Object.assign(this, init);
  }
}
