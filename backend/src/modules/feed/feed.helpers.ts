// src/modules/feed/feed.helpers.ts
import { BadRequestException, Logger } from '@nestjs/common';
import { In, LessThanOrEqual, Repository } from 'typeorm';
import { DateTime } from 'luxon';

import { PostBlock } from '../post/entity/post-block.entity';
import { PostContributor } from '../post/entity/post-contributor.entity';
import { GroupMember } from '../group/entity/group_member.entity';
import { PostBlockType } from '@/enums/post-block-type.enum';
import { BlockValueMap } from '@/modules/post/types/post-block.types';
import { GroupRoleEnum } from '@/enums/group-role.enum';
import {
  FeedBlockDto,
  FeedContributorDto,
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
  postContributorRepo: Repository<PostContributor>,
  groupMemberRepo: Repository<GroupMember>,
  logger: Logger,
  userId?: string,
): Promise<{ cards: FeedCardResponseDto[]; warnings: FeedWarning[] }> {
  const requesterId = userId ?? '';
  const postIds = posts.map((p) => p.id);
  const postById = new Map(posts.map((p) => [p.id, p]));
  const groupIds = Array.from(
    new Set(posts.map((p) => p.groupId).filter(Boolean) as string[]),
  );

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
  const contributorsByPostId = new Map<string, FeedContributorDto[]>();
  if (postIds.length > 0) {
    const contributorRows = await postContributorRepo.find({
      where: { postId: In(postIds) },
      relations: ['user'],
    });
    const activeContributors = contributorRows.filter(
      (c): c is PostContributor & { user: { id: string } } => Boolean(c.user),
    );

    const groupPairs: Array<{ groupId: string; userId: string }> = [];
    activeContributors.forEach((c) => {
      const post = postById.get(c.postId);
      if (post?.groupId) {
        groupPairs.push({ groupId: post.groupId, userId: c.userId });
      }
    });

    const groupMemberMap = new Map<
      string,
      { nicknameInGroup?: string | null; profileMediaId?: string | null }
    >();
    if (groupPairs.length > 0) {
      const members = await groupMemberRepo.find({
        where: groupPairs,
        select: ['groupId', 'userId', 'nicknameInGroup', 'profileMediaId'],
      });
      members.forEach((member) => {
        const key = `${member.groupId}:${member.userId}`;
        groupMemberMap.set(key, {
          nicknameInGroup: member.nicknameInGroup ?? null,
          profileMediaId: member.profileMediaId ?? null,
        });
      });
    }

    activeContributors.forEach((c) => {
      const post = postById.get(c.postId);
      const groupKey = post?.groupId ? `${post.groupId}:${c.userId}` : null;
      const groupMember = groupKey ? groupMemberMap.get(groupKey) : undefined;

      const dto: FeedContributorDto = {
        userId: c.userId,
        role: c.role,
        nickname: c.user?.nickname ?? null,
        groupNickname: groupMember?.nicknameInGroup ?? null,
        profileImageId: c.user?.profileImageId ?? null,
        groupProfileImageId: groupMember?.profileMediaId ?? null,
      };

      const list = contributorsByPostId.get(c.postId) ?? [];
      list.push(dto);
      contributorsByPostId.set(c.postId, list);
    });
  }

  const groupRoleByGroupId = new Map<string, GroupRoleEnum>();
  if (groupIds.length > 0) {
    const memberRows = await groupMemberRepo.find({
      where: groupIds.map((groupId) => ({ groupId, userId: requesterId })),
      select: ['groupId', 'role'],
    });
    memberRows.forEach((member) => {
      groupRoleByGroupId.set(member.groupId, member.role);
    });
  }

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
    const isOwner = p.ownerUserId === requesterId;
    let permission: 'ADMIN' | 'EDITOR' | 'VIEWER' | 'OWNER' | null = null;
    if (p.groupId) {
      const role = groupRoleByGroupId.get(p.groupId);
      permission = role ?? null;
    } else {
      permission = isOwner ? 'OWNER' : null;
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
        contributors: contributorsByPostId.get(p.id) ?? [],
        permission,
      }),
    );
  }

  return { cards, warnings };
}
