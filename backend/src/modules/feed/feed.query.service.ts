// src/modules/feed/feed.query.service.ts
import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Brackets,
  In,
  LessThanOrEqual,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';
import { DateTime } from 'luxon';

import { Post } from '../post/entity/post.entity';
import { GroupMember } from '../group/entity/group_member.entity';
import { PostScope } from '@/enums/post-scope.enum';
import { GetFeedQueryDto } from './dto/get-feed.query.dto';
import {
  FeedBlockDto,
  FeedCardResponseDto,
} from './dto/feed-card.response.dto';
import { PostContributor } from '../post/entity/post-contributor.entity';
import { PostBlock } from '../post/entity/post-block.entity';
import { PostBlockType } from '@/enums/post-block-type.enum';
import { BlockValueMap } from '@/modules/post/types/post-block.types';

type DayRange = { from: Date; to: Date };
type FeedWarning = {
  code: 'EVENT_AT_MISSING';
  message: string;
  context?: {
    postId: string;
    title: string;
  };
};

function dayRange(day: string, tz: string): DayRange {
  const dateOnly = DateTime.fromISO(day, { zone: 'UTC' });
  if (!dateOnly.isValid) throw new BadRequestException('Invalid date');

  const zoned = DateTime.fromISO(day, { zone: tz });
  if (!zoned.isValid) throw new BadRequestException('Invalid tz');

  const from = zoned.startOf('day');

  const to = from.plus({ days: 1 });

  // DB에는 Date로 넘기면 UTC로 변환되어 안전
  return { from: from.toJSDate(), to: to.toJSDate() };
}

@Injectable()
export class FeedQueryService {
  private readonly logger = new Logger(FeedQueryService.name);

  constructor(
    @InjectRepository(Post)
    private readonly postRepo: Repository<Post>,
    @InjectRepository(PostBlock)
    private readonly postBlockRepo: Repository<PostBlock>,
    @InjectRepository(GroupMember)
    private readonly groupMemberRepo: Repository<GroupMember>,
  ) {}

  async getFeedForUser(userId: string, query: GetFeedQueryDto) {
    // 날짜 필터링을 위해 date 파싱
    const { from, to } = dayRange(query.date, query.tz ?? 'Asia/Seoul');

    // 1) posts 조회
    // - scope 없음: 내 개인글 + 내가 작성한 그룹 글
    // - scope=PERSONAL: 내 개인글만
    // - scope=GROUP: 내가 속한 그룹의 전체 글
    const postsQb = this.postRepo.createQueryBuilder('p');

    if (query.scope === PostScope.GROUP) {
      const groupIds = await this.groupMemberRepo.find({
        where: { userId },
        select: { groupId: true },
      });
      const groupIdList = groupIds.map((member) => member.groupId);
      if (groupIdList.length === 0) {
        return { cards: [], warnings: [] };
      }
      postsQb.where('p.scope = :scope', { scope: PostScope.GROUP });
      postsQb.andWhere('p.groupId IN (:...groupIds)', {
        groupIds: groupIdList,
      });
    } else if (query.scope === PostScope.PERSONAL) {
      postsQb.where('p.scope = :scope', { scope: PostScope.PERSONAL });
      postsQb.andWhere('p.ownerUserId = :userId', { userId });
    } else {
      // NOTE: 기본 피드는 contributor 기반으로만 필터링한다.
      // contributor 기록이 누락되면 피드에서 빠질 수 있으니,
      // 생성/발행 시 owner를 contributor로 항상 저장해야 한다.
      postsQb.where(
        new Brackets((qb: SelectQueryBuilder<Post>) => {
          qb.where(
            (subQb: SelectQueryBuilder<Post>) => {
              const sub = subQb
                .subQuery()
                .select('1')
                .from(PostContributor, 'pc')
                .where('pc.postId = p.id')
                .andWhere('pc.userId = :userId')
                .andWhere('pc.role IN (:...roles)')
                .getQuery();

              return `EXISTS ${sub}`;
            },
            { userId, roles: ['AUTHOR', 'EDITOR'] },
          );
        }),
      );
    }
    if (from && to) {
      postsQb.andWhere('p.eventAt >= :from AND p.eventAt < :to', { from, to });
    }

    // 정렬 정책은 일단 최신순
    postsQb.orderBy('p.eventAt', 'DESC').addOrderBy('p.id', 'DESC');

    postsQb.select([
      'p.id',
      'p.groupId',
      'p.eventAt',
      'p.createdAt',
      'p.updatedAt',

      // meta 컬럼들
      'p.title',
      'p.tags',
      'p.emotion',
      'p.rating',
    ]);

    const posts = await postsQb.getMany();
    const postIds = posts.map((p) => p.id);

    // 2) LOCATION 블록 한번에 조회 (postIds IN ...)
    // - type='LOCATION'만
    // - postId별로 1개만 있어야 함
    type LocationBlockRow = {
      postId: string;
      value: BlockValueMap[typeof PostBlockType.LOCATION];
    };

    const locationBlocks: LocationBlockRow[] = postIds.length
      ? ((await this.postBlockRepo.find({
          where: { postId: In(postIds), type: PostBlockType.LOCATION },
          select: { postId: true, value: true },
        })) as LocationBlockRow[])
      : [];

    const locationByPostId = new Map<string, LocationBlockRow['value']>();
    for (const b of locationBlocks) {
      locationByPostId.set(b.postId, b.value);
    }

    // 3) 미리보기 블록 (row 7까지)
    type blockRow = {
      postId: string;
      type: PostBlockType;
      value: BlockValueMap[PostBlockType];
      layoutRow: number;
      layoutCol: number;
      layoutSpan: number;
    };

    const blocks: blockRow[] = postIds.length
      ? ((await this.postBlockRepo.find({
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
        })) as blockRow[])
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

    // 4) 응답 매핑
    const cards: FeedCardResponseDto[] = [];
    const warnings: FeedWarning[] = [];
    const addWarning = (warning: FeedWarning) => warnings.push(warning);
    for (const p of posts) {
      const loc = locationByPostId.get(p.id) ?? null;
      const scope = p.groupId ? 'GROUP' : 'ME';
      if (!p.eventAt) {
        this.logger.warn(
          `eventAt is missing for postId=${p.id} title=${p.title}`,
        );
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
}
