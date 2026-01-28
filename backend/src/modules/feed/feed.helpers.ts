// src/modules/feed/feed.helpers.ts
import { BadRequestException, Logger } from '@nestjs/common';
import { In, LessThanOrEqual, Repository } from 'typeorm';
import { DateTime } from 'luxon';

import { PostBlock } from '../post/entity/post-block.entity';
import { PostBlockType } from '@/enums/post-block-type.enum';
import { BlockValueMap } from '@/modules/post/types/post-block.types';
import {
  FeedBlockDto,
  FeedCardResponseDto,
} from './dto/feed-card.response.dto';
import type { Post } from '../post/entity/post.entity';

type DayRange = { from: Date; to: Date };
type FeedWarning = {
  code: 'EVENT_AT_MISSING';
  message: string;
  context?: {
    postId: string;
    title: string;
  };
};

export function dayRange(day: string, tz: string): DayRange {
  const dateOnly = DateTime.fromISO(day, { zone: 'UTC' });
  if (!dateOnly.isValid) throw new BadRequestException('Invalid date');

  const zoned = DateTime.fromISO(day, { zone: tz });
  if (!zoned.isValid) throw new BadRequestException('Invalid tz');

  const from = zoned.startOf('day');
  const to = from.plus({ days: 1 });

  // DB에는 Date로 넘기면 UTC로 변환되어 안전
  return { from: from.toJSDate(), to: to.toJSDate() };
}

export async function buildFeedCards(
  posts: Post[],
  postBlockRepo: Repository<PostBlock>,
  logger: Logger,
): Promise<{ cards: FeedCardResponseDto[]; warnings: FeedWarning[] }> {
  const postIds = posts.map((p) => p.id);

  // 1) LOCATION 블록 한번에 조회 (postIds IN ...)
  // - type='LOCATION'만
  // - postId별로 1개만 있어야 함
  type LocationBlockRow = {
    postId: string;
    value: BlockValueMap[typeof PostBlockType.LOCATION];
  };

  const locationBlocks: LocationBlockRow[] = postIds.length
    ? ((await postBlockRepo.find({
        where: { postId: In(postIds), type: PostBlockType.LOCATION },
        select: { postId: true, value: true },
      })) as LocationBlockRow[])
    : [];

  const locationByPostId = new Map<string, LocationBlockRow['value']>();
  for (const b of locationBlocks) {
    locationByPostId.set(b.postId, b.value);
  }

  // 2) 미리보기 블록 (row 7까지)
  type BlockRow = {
    postId: string;
    type: PostBlockType;
    value: BlockValueMap[PostBlockType];
    layoutRow: number;
    layoutCol: number;
    layoutSpan: number;
  };

  const blocks: BlockRow[] = postIds.length
    ? ((await postBlockRepo.find({
        where: { postId: In(postIds), layoutRow: LessThanOrEqual(7) },
        select: {
          postId: true,
          type: true,
          value: true,
          layoutRow: true,
          layoutCol: true,
          layoutSpan: true,
        },
        order: { layoutRow: 'ASC', layoutCol: 'ASC' },
      })) as BlockRow[])
    : [];

  const blockByPostId = new Map<string, FeedBlockDto[]>();
  for (const block of blocks) {
    const list = blockByPostId.get(block.postId) ?? [];
    list.push({
      type: block.type,
      value: block.value,
      layout: {
        row: block.layoutRow,
        col: block.layoutCol,
        span: block.layoutSpan,
      },
    });
    blockByPostId.set(block.postId, list);
  }

  // 3) 응답 매핑
  const cards: FeedCardResponseDto[] = [];
  const warnings: FeedWarning[] = [];
  const addWarning = (warning: FeedWarning) => warnings.push(warning);

  for (const p of posts) {
    const loc = locationByPostId.get(p.id) ?? null;
    const scope = p.groupId ? 'GROUP' : 'ME';
    if (!p.eventAt) {
      logger.warn(`eventAt is missing for postId=${p.id} title=${p.title}`);
      addWarning({
        code: 'EVENT_AT_MISSING',
        message: 'eventAt is missing',
        context: {
          postId: p.id,
          title: p.title,
        },
      });
      continue;
    }
    cards.push(
      new FeedCardResponseDto({
        postId: p.id,
        scope,
        groupId: p.groupId ?? null,
        eventAt: new Date(p.eventAt),
        createdAt: new Date(p.createdAt),
        updatedAt: new Date(p.updatedAt),
        title: p.title,
        location: loc
          ? {
              lng: loc.lng,
              lat: loc.lat,
              address: loc.address,
              placeName: loc.placeName,
            }
          : null,
        blocks: blockByPostId.get(p.id) ?? [],
        tags: p.tags ?? null,
        emotion: p.emotion ?? null,
        rating: p.rating ?? null,
      }),
    );
  }

  return { cards, warnings };
}
