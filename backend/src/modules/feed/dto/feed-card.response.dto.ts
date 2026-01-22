import { PostBlockType } from '@/enums/post-block-type.enum';
import { BlockValueMap } from '@/modules/post/types/post-block.types';
import { PostMood } from '@/enums/post-mood.enum';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BlockLayoutDto } from '@/modules/post/dto/block-layout.dto';

// src/modules/feed/dto/feed-card.response.dto.ts
export const FeedScope = {
  ME: 'ME',
  GROUP: 'GROUP',
} as const;

export type FeedScope = (typeof FeedScope)[keyof typeof FeedScope];

export class FeedBlockDto {
  @ApiProperty({ enum: PostBlockType })
  type: PostBlockType;
  @ApiProperty()
  value: BlockValueMap[PostBlockType];
  @ApiProperty({ type: () => BlockLayoutDto })
  layout: BlockLayoutDto;
}

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
  tags: string[] | null;
  @ApiPropertyOptional({ enum: PostMood })
  emotion: PostMood[] | null;
  @ApiPropertyOptional()
  rating: number | null;
  @ApiProperty({ type: () => [FeedBlockDto] })
  blocks: FeedBlockDto[];
  constructor(init: FeedCardResponseDto) {
    Object.assign(this, init);
  }
}
