import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, Brackets, In } from 'typeorm';
import type { Point } from 'geojson';
import { Post } from '@/modules/post/entity/post.entity';
import { PostBlock } from '@/modules/post/entity/post-block.entity';
import { PostBlockType } from '@/enums/post-block-type.enum';
import { BlockValueMap } from '@/modules/post/types/post-block.types';
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
      lat,
      lng,
      radius,
      from,
      to,
      tags,
      cursor,
      limit = 20,
      scope,
      groupId,
    } = queryDto;

    const query = this.postRepository
      .createQueryBuilder('post')
      .where('post.deletedAt IS NULL')
      .andWhere(
        'ST_DWithin(post.location, ST_SetSRID(ST_Point(:lng, :lat), 4326), :radius)',
        {
          lng,
          lat,
          radius,
        },
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
      query.andWhere('post.eventAt >= :from', { from });
    }
    if (to) {
      query.andWhere('post.eventAt <= :to', { to });
    }
    if (tags) {
      const tagList = tags.split(',').map((t) => t.trim());
      query.andWhere('post.tags && :tagList', { tagList });
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
    const thumbnailMap = new Map<string, string | null>();
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
        if (thumbnailMap.has(block.postId)) return;
        const val = block.value as BlockValueMap[typeof PostBlockType.IMAGE];
        const mediaId = val.mediaIds?.[0] ?? null;
        thumbnailMap.set(block.postId, mediaId);
      });
    }

    const resultItems: MapPostItemDto[] = await Promise.all(
      items.map(async (post) => {
        const thumbnailMediaId = thumbnailMap.get(post.id) ?? null;

        // Find location block for placeName/address
        const locationBlock = await this.postRepository.manager.findOne(
          PostBlock,
          {
            where: { postId: post.id, type: PostBlockType.LOCATION },
          },
        );

        let placeDisplay: string | null = null;
        if (locationBlock) {
          const val = locationBlock.value as {
            address?: string;
            placeName?: string;
          };
          placeDisplay = val.placeName || val.address || null;
        }

        return {
          id: post.id,
          lat: (post.location as Point).coordinates[1],
          lng: (post.location as Point).coordinates[0],
          title: post.title,
          thumbnailMediaId,
          createdAt: post.eventAt || post.createdAt,
          tags: post.tags || [],
          placeName: placeDisplay,
        };
      }),
    );

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
}
