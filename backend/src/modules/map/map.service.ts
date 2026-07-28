import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, Brackets, In } from 'typeorm';
import type { Point } from 'geojson';
import { Post } from '@/modules/post/entity/post.entity';
import { PostBlock } from '@/modules/post/entity/post-block.entity';
import { PostBlockType } from '@/enums/post-block-type.enum';
import { BlockValueMap } from '@/modules/post/types/post-block.types';
import { DateTime } from 'luxon';
import {
  MapPostsQueryDto,
  PaginatedMapPostsResponseDto,
  MapPostItemDto,
  MapScope,
} from './dto/map-query.dto';

@Injectable()
export class MapService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(PostBlock)
    private readonly postBlockRepository: Repository<PostBlock>,
  ) {}

  async findPostsWithinRadius(
    userId: string,
    queryDto: MapPostsQueryDto,
  ): Promise<PaginatedMapPostsResponseDto> {
    const {
      from,
      to,
      tags,
      emotions,
      cursor,
      limit = 20,
      scope,
      groupId,
      minLng,
      minLat,
      maxLng,
      maxLat,
    } = queryDto;

    const query = this.postRepository
      .createQueryBuilder('post')
      .where('post.deletedAt IS NULL');

    query.andWhere(
      'post.location && ST_MakeEnvelope(:minLng, :minLat, :maxLng, :maxLat, 4326)',
      { minLng, minLat, maxLng, maxLat },
    );

    // Scope-based filtering
    if (scope === MapScope.PERSONAL) {
      // 내가 작성자이거나 기여자(contributor)인 글
      query.andWhere(
        new Brackets((qb) => {
          qb.where('post.ownerUserId = :userId', { userId }).orWhere(
            'EXISTS (SELECT 1 FROM post_contributors pc WHERE pc.post_id = post.id AND pc.user_id = :userId)',
            { userId },
          );
        }),
      );
    } else if (scope === MapScope.GROUP) {
      if (!groupId) {
        throw new BadRequestException('groupId is required for group scope');
      }
      query.andWhere('post.groupId = :groupId', { groupId });
    }

    // Filters
    if (from) {
      query.andWhere('post.eventAt >= :from', {
        from: this.normalizeDateBoundary(from, 'start'),
      });
    }
    if (to) {
      query.andWhere('post.eventAt <= :to', {
        to: this.normalizeDateBoundary(to, 'end'),
      });
    }
    if (tags) {
      const tagList = tags.split(',').map((t) => t.trim());
      query.andWhere('post.tags && :tagList', { tagList });
    }
    if (emotions) {
      const emotionList = emotions.split(',').map((e) => e.trim());
      query.andWhere('post.emotion && :emotionList', { emotionList });
    }

    // Pagination
    this.applyCursor(query, cursor);

    // Sorting: Most recent first
    query.orderBy('post.eventAt', 'DESC').addOrderBy('post.id', 'DESC');

    query.take(limit + 1);

    const posts = await query.getMany();

    const hasNextPage = posts.length > limit;
    const items = posts.slice(0, limit);

    const postIds = items.map((post) => post.id);
    const previewMediaMap = new Map<string, string[]>();
    if (postIds.length > 0) {
      const imageBlocks = await this.postBlockRepository.find({
        where: {
          postId: In(postIds),
          type: PostBlockType.IMAGE,
        },
        order: {
          layoutRow: 'ASC',
          layoutCol: 'ASC',
          layoutSpan: 'ASC',
        },
      });
      imageBlocks.forEach((block) => {
        const val = block.value as BlockValueMap[typeof PostBlockType.IMAGE];
        const mediaIds = val.mediaIds ?? [];
        const existing = previewMediaMap.get(block.postId) ?? [];
        const merged = [...existing, ...mediaIds].slice(0, 5);
        previewMediaMap.set(block.postId, merged);
      });
    }

    // Snippet extraction (first text block per post) — 검색 결과와 동일한 방식.
    // post당 findOne을 따로 부르면 최대 limit개의 추가 쿼리가 나가므로,
    // 이미지 블록과 동일하게 postIds 전체를 한 번에 조회해 맵으로 구성한다.
    const firstTextBlockByPostId = new Map<string, PostBlock>();
    if (postIds.length > 0) {
      const textBlocks = await this.postBlockRepository.find({
        where: { postId: In(postIds), type: PostBlockType.TEXT },
        order: { postId: 'ASC', layoutRow: 'ASC', layoutCol: 'ASC' },
      });
      for (const block of textBlocks) {
        if (!firstTextBlockByPostId.has(block.postId)) {
          firstTextBlockByPostId.set(block.postId, block);
        }
      }
    }

    // Location block for placeName/address — 위와 같은 이유로 배치 조회한다.
    const locationBlockByPostId = new Map<string, PostBlock>();
    if (postIds.length > 0) {
      const locationBlocks = await this.postBlockRepository.find({
        where: { postId: In(postIds), type: PostBlockType.LOCATION },
        order: { postId: 'ASC', layoutRow: 'ASC', layoutCol: 'ASC' },
      });
      for (const block of locationBlocks) {
        if (!locationBlockByPostId.has(block.postId)) {
          locationBlockByPostId.set(block.postId, block);
        }
      }
    }

    const resultItems: MapPostItemDto[] = items.map((post) => {
      const previewMediaIds = previewMediaMap.get(post.id) ?? [];

      const locationBlock = locationBlockByPostId.get(post.id);

      let placeDisplay: string | null = null;
      if (locationBlock) {
        const val = locationBlock.value as {
          address?: string;
          placeName?: string;
        };
        placeDisplay = val.placeName || val.address || null;
      }

      const firstTextBlock = firstTextBlockByPostId.get(post.id);

      return {
        id: post.id,
        lat: (post.location as Point).coordinates[1],
        lng: (post.location as Point).coordinates[0],
        title: post.title,
        previewMediaIds,
        createdAt: post.eventAt || post.createdAt,
        tags: post.tags || [],
        emotion: post.emotion ?? [],
        placeName: placeDisplay,
        snippet: firstTextBlock
          ? (firstTextBlock.value as { text: string }).text.substring(0, 100)
          : undefined,
      };
    });

    let nextCursor: string | null = null;
    if (hasNextPage) {
      const lastItem = items[items.length - 1];
      if (lastItem.eventAt) {
        nextCursor = this.encodeCursor(lastItem.eventAt, lastItem.id);
      }
    }

    return {
      items: resultItems,
      hasNextPage,
      nextCursor,
    };
  }

  private applyCursor(query: SelectQueryBuilder<Post>, cursor?: string) {
    if (!cursor) return;

    try {
      const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
      const [eventAtStr, id] = decoded.split('|');
      const eventAt = new Date(eventAtStr);

      query.andWhere(
        new Brackets((qb) => {
          qb.where('post.eventAt < :eventAt', { eventAt }).orWhere(
            'post.eventAt = :eventAt AND post.id < :id',
            { eventAt, id },
          );
        }),
      );
    } catch {
      // Ignore invalid cursor
    }
  }

  private encodeCursor(eventAt: Date, id: string): string {
    const value = `${eventAt.toISOString()}|${id}`;
    return Buffer.from(value).toString('base64');
  }

  // 날짜만 있는 문자열(YYYY-MM-DD)을 하루의 시작/끝 시각으로 정규화
  // search.service.ts의 normalizeDateOnlyBoundary와 동일한 방식
  private normalizeDateBoundary(
    value: string,
    boundary: 'start' | 'end',
  ): string {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    const dt = DateTime.fromISO(value, { zone: 'Asia/Seoul' });
    return (
      (boundary === 'start' ? dt.startOf('day') : dt.endOf('day')).toISO() ??
      value
    );
  }
}
