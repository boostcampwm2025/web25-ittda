import { PostBlockType } from '@/enums/post-block-type.enum';
import { BlockValueMap } from '@/modules/post/types/post-block.types';
import { PostMood } from '@/enums/post-mood.enum';
import { PostContributorRole } from '@/enums/post-contributor-role.enum';
import {
  ApiExtraModels,
  ApiProperty,
  ApiPropertyOptional,
  getSchemaPath,
} from '@nestjs/swagger';
import {
  MoodValueDto,
  LocationValueDto,
  RatingValueDto,
  MediaValueDto,
} from '@/modules/post/dto/post-block.dto';
import { BlockLayoutDto } from '@/modules/post/dto/block-layout.dto';

// src/modules/feed/dto/feed-card.response.dto.ts
export const FeedScope = {
  ME: 'ME',
  GROUP: 'GROUP',
} as const;

export type FeedScope = (typeof FeedScope)[keyof typeof FeedScope];

@ApiExtraModels(MoodValueDto, LocationValueDto, RatingValueDto, MediaValueDto)
export class FeedBlockDto {
  @ApiProperty({ enum: PostBlockType })
  type: PostBlockType;

  @ApiProperty({
    description:
      'Block value. When type=MOOD, LOCATION, RATING, or MEDIA, value shape is enforced.',
    oneOf: [
      { type: 'object', additionalProperties: true },
      { $ref: getSchemaPath(MoodValueDto) },
      { $ref: getSchemaPath(LocationValueDto) },
      { $ref: getSchemaPath(RatingValueDto) },
      { $ref: getSchemaPath(MediaValueDto) },
    ],
  })
  value: BlockValueMap[PostBlockType];

  @ApiProperty({ type: () => BlockLayoutDto })
  layout: BlockLayoutDto;
}

export class FeedContributorDto {
  @ApiProperty({ format: 'uuid' })
  userId: string;

  @ApiProperty({ enum: PostContributorRole })
  role: PostContributorRole;

  @ApiPropertyOptional()
  nickname?: string | null;

  @ApiPropertyOptional()
  groupNickname?: string | null;

  @ApiPropertyOptional({ format: 'uuid' })
  profileImageId?: string | null;

  @ApiPropertyOptional({ format: 'uuid' })
  groupProfileImageId?: string | null;
}

export class FeedCardResponseDto {
  @ApiProperty({ format: 'uuid' })
  postId: string;
  @ApiProperty({ enum: FeedScope })
  scope: FeedScope;
  @ApiPropertyOptional({ format: 'uuid' })
  // 그룹 글이면 groupId, 개인 글이면 null
  groupId?: string | null;
  @ApiPropertyOptional({
    description: '그룹 이름 (그룹 글일 때만 제공)',
  })
  groupName?: string | null;
  // 카드에 보여줄 것들(프로젝트 스펙에 맞게 수정)
  @ApiProperty({ example: '부스트캠프 회식' })
  title: string;
  @ApiProperty({ example: '2026-01-28T18:59:34.000Z' })
  eventAt: Date; // ISO string
  @ApiProperty()
  createdAt: Date; // ISO string
  @ApiProperty()
  updatedAt: Date; // ISO string
  @ApiPropertyOptional({
    description: '위치 정보',
    example: { lat: 37.5665, lng: 126.978, address: '서울특별시 강남구' },
  })
  location: BlockValueMap[typeof PostBlockType.LOCATION] | null;
  @ApiPropertyOptional({ example: '18:30' })
  time?: string | null;
  @ApiPropertyOptional({ example: ['회식', '강남'] })
  tags: string[] | null;
  @ApiPropertyOptional({ enum: PostMood, example: [PostMood.HAPPY] })
  emotion: PostMood[] | null;
  @ApiPropertyOptional({ example: 4.5 })
  rating: number | null;
  @ApiProperty({ type: () => [FeedBlockDto] })
  blocks: FeedBlockDto[];
  @ApiProperty({ type: () => [FeedContributorDto] })
  contributors: FeedContributorDto[];
  @ApiProperty({
    description: '요청자 기준 권한 정보',
    example: 'EDITOR',
  })
  permission: 'ADMIN' | 'EDITOR' | 'VIEWER' | 'OWNER' | null;
  constructor(init: FeedCardResponseDto) {
    Object.assign(this, init);
  }
}
