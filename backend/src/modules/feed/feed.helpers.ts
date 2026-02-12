// src/modules/feed/feed.helpers.ts
import { BadRequestException, Logger } from '@nestjs/common';
import { In, LessThanOrEqual, Repository } from 'typeorm';
import { DateTime } from 'luxon';

import { PostBlock } from '../post/entity/post-block.entity';
import { PostContributor } from '../post/entity/post-contributor.entity';
import { PostDraft } from '../post/entity/post-draft.entity';
import { GroupMember } from '../group/entity/group_member.entity';
import { Group } from '../group/entity/group.entity';
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
type BuildFeedCardsOptions = {
  includeGroupName?: boolean;
  groupRepo?: Repository<Group>;
  draftRepo?: Repository<PostDraft>;
};
type BuildFeedCardsResult = {
  cards: FeedCardResponseDto[];
  warnings: FeedWarning[];
};
type LocationBlockRow = {
  postId: string;
  value: BlockValueMap[typeof PostBlockType.LOCATION];
};
type PreviewBlockRow = {
  postId: string;
  type: PostBlockType;
  value: BlockValueMap[PostBlockType];
  layoutRow: number;
  layoutCol: number;
  layoutSpan: number;
};
type GroupMemberProfile = {
  nicknameInGroup?: string | null;
  profileMediaId?: string | null;
};
type FeedBlockMaps = {
  locationByPostId: Map<string, LocationBlockRow['value']>;
  timeByPostId: Map<string, string>;
  blockByPostId: Map<string, FeedBlockDto[]>;
};
type ActiveContributor = PostContributor & { user: { id: string } };
type ContributorsContext = {
  postById: Map<string, Post>;
  activeContributors: ActiveContributor[];
};
type GroupMemberContext = {
  groupMemberMap: Map<string, GroupMemberProfile>;
  groupRoleByGroupId: Map<string, GroupRoleEnum>;
};

/**
 * 주어진 날짜 문자열과 타임존을 기준으로 하루 범위를 계산한다.
 * 반환되는 `from`, `to`는 DB 쿼리에 바로 사용할 수 있도록 `Date`(UTC 변환 가능) 형태다.
 *
 * @remarks 호출부에서는 일반적으로 `eventAt >= from AND eventAt < to` 형태로 사용하는 것을 권장한다.
 * @param day 조회 기준 날짜(ISO 형식, 예: `2026-02-12`)
 * @param tz IANA 타임존(예: `Asia/Seoul`)
 * @returns from(해당 날짜 시작 시각)과 to(다음 날짜 시작 시각)
 * @throws {BadRequestException} 날짜 또는 타임존 형식이 유효하지 않은 경우
 */
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

/**
 * 게시글 목록을 피드 카드 응답 구조로 조립한다.
 * 블록/기여자/그룹 메타데이터를 배치 조회한 뒤 post 단위로 합성한다.
 *
 * @param posts 피드로 변환할 게시글 목록
 * @param postBlockRepo 게시글 블록 조회용 리포지토리
 * @param postContributorRepo 기여자 조회용 리포지토리
 * @param groupMemberRepo 그룹 멤버 메타 조회용 리포지토리
 * @param logger 경고 로그 기록용 로거
 * @param userId 피드를 조회하는 사용자 ID(미전달 시 권한 계산은 최소값으로 처리)
 * @param options 그룹 이름/활성 편집 draft 포함 여부 옵션
 * @returns 카드 목록과 변환 중 수집된 경고 목록
 */
export async function buildFeedCards(
  posts: Post[],
  postBlockRepo: Repository<PostBlock>,
  postContributorRepo: Repository<PostContributor>,
  groupMemberRepo: Repository<GroupMember>,
  logger: Logger,
  userId?: string,
  options: BuildFeedCardsOptions = {},
): Promise<BuildFeedCardsResult> {
  const { includeGroupName = false, groupRepo, draftRepo } = options;
  const requesterId = userId ?? '';
  const postIds = posts.map((p) => p.id);
  const groupIds = extractGroupIds(posts);

  const [
    groupNameByGroupId,
    activeEditDraftPostIds,
    blockMaps,
    contributorsContext,
  ] = await Promise.all([
    loadGroupNameByGroupId(groupIds, includeGroupName, groupRepo),
    loadActiveEditDraftPostIds(posts, draftRepo),
    loadFeedBlockMaps(postIds, postBlockRepo),
    loadContributorsContext(posts, postIds, postContributorRepo),
  ]);
  const { locationByPostId, timeByPostId, blockByPostId } = blockMaps;
  const { groupMemberMap, groupRoleByGroupId } = await loadGroupMemberContext(
    contributorsContext.activeContributors,
    contributorsContext.postById,
    groupIds,
    requesterId,
    groupMemberRepo,
  );
  const contributorsByPostId = mapContributorsByPostId(
    contributorsContext.activeContributors,
    contributorsContext.postById,
    groupMemberMap,
  );

  return mapPostsToFeedCards(posts, {
    requesterId,
    logger,
    locationByPostId,
    timeByPostId,
    blockByPostId,
    contributorsByPostId,
    groupRoleByGroupId,
    groupNameByGroupId,
    activeEditDraftPostIds,
  });
}

function extractGroupIds(posts: Post[]): string[] {
  return Array.from(
    new Set(posts.map((p) => p.groupId).filter(Boolean) as string[]),
  );
}

async function loadGroupNameByGroupId(
  groupIds: string[],
  includeGroupName: boolean,
  groupRepo?: Repository<Group>,
): Promise<Map<string, string>> {
  const groupNameByGroupId = new Map<string, string>();
  if (!includeGroupName || !groupRepo || groupIds.length === 0) {
    return groupNameByGroupId;
  }

  const groups = await groupRepo.find({
    where: { id: In(groupIds) },
    select: ['id', 'name'],
  });
  groups.forEach((group) => {
    groupNameByGroupId.set(group.id, group.name);
  });

  return groupNameByGroupId;
}

async function loadActiveEditDraftPostIds(
  posts: Post[],
  draftRepo?: Repository<PostDraft>,
): Promise<Set<string>> {
  const activeEditDraftPostIds = new Set<string>();
  const groupPostIds = posts.filter((p) => Boolean(p.groupId)).map((p) => p.id);
  if (!draftRepo || groupPostIds.length === 0) {
    return activeEditDraftPostIds;
  }

  const activeDrafts = await draftRepo.find({
    where: {
      kind: 'EDIT',
      isActive: true,
      targetPostId: In(groupPostIds),
    },
    select: { targetPostId: true },
  });
  activeDrafts.forEach((draft) => {
    if (draft.targetPostId) {
      activeEditDraftPostIds.add(draft.targetPostId);
    }
  });

  return activeEditDraftPostIds;
}

async function loadFeedBlockMaps(
  postIds: string[],
  postBlockRepo: Repository<PostBlock>,
): Promise<FeedBlockMaps> {
  const locationByPostId = new Map<string, LocationBlockRow['value']>();
  const timeByPostId = new Map<string, string>();
  const blockByPostId = new Map<string, FeedBlockDto[]>();
  if (postIds.length === 0) {
    return { locationByPostId, timeByPostId, blockByPostId };
  }

  const blocks = (await postBlockRepo.find({
    where: [
      {
        postId: In(postIds),
        type: In([PostBlockType.LOCATION, PostBlockType.TIME]),
      },
      { postId: In(postIds), layoutRow: LessThanOrEqual(7) },
    ],
    select: {
      postId: true,
      type: true,
      value: true,
      layoutRow: true,
      layoutCol: true,
      layoutSpan: true,
    },
    order: { layoutRow: 'ASC', layoutCol: 'ASC' },
  })) as PreviewBlockRow[];

  for (const block of blocks) {
    if (block.type === PostBlockType.LOCATION) {
      locationByPostId.set(
        block.postId,
        block.value as LocationBlockRow['value'],
      );
    }
    if (block.type === PostBlockType.TIME) {
      const value = block.value as { time?: string };
      if (value?.time) {
        timeByPostId.set(block.postId, value.time);
      }
    }
    if (block.layoutRow <= 7) {
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
  }

  return { locationByPostId, timeByPostId, blockByPostId };
}

function makeGroupMemberKey(groupId: string, userId: string): string {
  return `${groupId}:${userId}`;
}

async function loadContributorsContext(
  posts: Post[],
  postIds: string[],
  postContributorRepo: Repository<PostContributor>,
): Promise<ContributorsContext> {
  const empty: ContributorsContext = {
    postById: new Map<string, Post>(),
    activeContributors: [],
  };
  if (postIds.length === 0) {
    return empty;
  }

  const postById = new Map(posts.map((p) => [p.id, p]));
  const contributorRows = await postContributorRepo.find({
    where: { postId: In(postIds) },
    relations: ['user'],
  });
  const activeContributors = contributorRows.filter(
    (contributor): contributor is ActiveContributor =>
      Boolean(contributor.user),
  );

  return {
    postById,
    activeContributors,
  };
}

async function loadGroupMemberContext(
  activeContributors: ActiveContributor[],
  postById: Map<string, Post>,
  groupIds: string[],
  requesterId: string,
  groupMemberRepo: Repository<GroupMember>,
): Promise<GroupMemberContext> {
  const groupMemberMap = new Map<string, GroupMemberProfile>();
  const groupRoleByGroupId = new Map<string, GroupRoleEnum>();
  const groupPairKeys = new Set<string>();

  for (const contributor of activeContributors) {
    const post = postById.get(contributor.postId);
    if (post?.groupId) {
      const key = makeGroupMemberKey(post.groupId, contributor.userId);
      groupPairKeys.add(key);
    }
  }
  if (requesterId) {
    for (const groupId of groupIds) {
      groupPairKeys.add(makeGroupMemberKey(groupId, requesterId));
    }
  }

  const groupPairs = Array.from(groupPairKeys, (key) => {
    const [groupId, userId] = key.split(':');
    return { groupId, userId };
  });
  if (groupPairs.length === 0) {
    return { groupMemberMap, groupRoleByGroupId };
  }

  const members = await groupMemberRepo.find({
    where: groupPairs,
    select: ['groupId', 'userId', 'role', 'nicknameInGroup', 'profileMediaId'],
  });

  for (const member of members) {
    const key = makeGroupMemberKey(member.groupId, member.userId);
    groupMemberMap.set(key, {
      nicknameInGroup: member.nicknameInGroup ?? null,
      profileMediaId: member.profileMediaId ?? null,
    });
    if (requesterId && member.userId === requesterId) {
      groupRoleByGroupId.set(member.groupId, member.role);
    }
  }

  return { groupMemberMap, groupRoleByGroupId };
}

function mapContributorsByPostId(
  activeContributors: ActiveContributor[],
  postById: Map<string, Post>,
  groupMemberMap: Map<string, GroupMemberProfile>,
): Map<string, FeedContributorDto[]> {
  const contributorsByPostId = new Map<string, FeedContributorDto[]>();

  for (const contributor of activeContributors) {
    const post = postById.get(contributor.postId);
    const groupKey = post?.groupId
      ? makeGroupMemberKey(post.groupId, contributor.userId)
      : null;
    const groupMember = groupKey ? groupMemberMap.get(groupKey) : undefined;

    const dto: FeedContributorDto = {
      userId: contributor.userId,
      role: contributor.role,
      nickname: contributor.user?.nickname ?? null,
      groupNickname: groupMember?.nicknameInGroup ?? null,
      profileImageId: contributor.user?.profileImageId ?? null,
      groupProfileImageId: groupMember?.profileMediaId ?? null,
    };

    const list = contributorsByPostId.get(contributor.postId) ?? [];
    list.push(dto);
    contributorsByPostId.set(contributor.postId, list);
  }

  return contributorsByPostId;
}

function resolveFeedPermission(
  post: Post,
  requesterId: string,
  groupRoleByGroupId: Map<string, GroupRoleEnum>,
): 'ADMIN' | 'EDITOR' | 'VIEWER' | 'OWNER' | null {
  if (post.groupId) {
    return groupRoleByGroupId.get(post.groupId) ?? null;
  }
  return post.ownerUserId === requesterId ? 'OWNER' : null;
}

function mapPostsToFeedCards(
  posts: Post[],
  context: {
    requesterId: string;
    logger: Logger;
    locationByPostId: Map<string, LocationBlockRow['value']>;
    timeByPostId: Map<string, string>;
    blockByPostId: Map<string, FeedBlockDto[]>;
    contributorsByPostId: Map<string, FeedContributorDto[]>;
    groupRoleByGroupId: Map<string, GroupRoleEnum>;
    groupNameByGroupId: Map<string, string>;
    activeEditDraftPostIds: Set<string>;
  },
): BuildFeedCardsResult {
  const cards: FeedCardResponseDto[] = [];
  const warnings: FeedWarning[] = [];

  for (const post of posts) {
    if (!post.eventAt) {
      context.logger.warn(
        `eventAt is missing for postId=${post.id} title=${post.title}`,
      );
      warnings.push({
        code: 'EVENT_AT_MISSING',
        message: 'eventAt is missing',
        context: {
          postId: post.id,
          title: post.title,
        },
      });
      continue;
    }

    const location = context.locationByPostId.get(post.id) ?? null;
    const scope = post.groupId ? 'GROUP' : 'ME';
    const permission = resolveFeedPermission(
      post,
      context.requesterId,
      context.groupRoleByGroupId,
    );

    cards.push(
      new FeedCardResponseDto({
        postId: post.id,
        scope,
        groupId: post.groupId ?? null,
        groupName: post.groupId
          ? (context.groupNameByGroupId.get(post.groupId) ?? null)
          : null,
        eventAt: new Date(post.eventAt),
        createdAt: new Date(post.createdAt),
        updatedAt: new Date(post.updatedAt),
        title: post.title,
        location: location
          ? {
              lng: location.lng,
              lat: location.lat,
              address: location.address,
              placeName: location.placeName,
            }
          : null,
        time: context.timeByPostId.get(post.id) ?? null,
        blocks: context.blockByPostId.get(post.id) ?? [],
        tags: post.tags ?? null,
        emotion: post.emotion ?? null,
        rating: post.rating ?? null,
        contributors: context.contributorsByPostId.get(post.id) ?? [],
        permission,
        hasActiveEditDraft: post.groupId
          ? context.activeEditDraftPostIds.has(post.id)
          : undefined,
      }),
    );
  }

  return { cards, warnings };
}
