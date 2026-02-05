import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, Brackets } from 'typeorm';
import { Post } from '@/modules/post/entity/post.entity';
import { PostBlock } from '@/modules/post/entity/post-block.entity';
import {
  PostMedia,
  PostMediaKind,
} from '@/modules/post/entity/post-media.entity';
import { PostBlockType } from '@/enums/post-block-type.enum';
import {
  SearchPostsDto,
  PaginatedSearchResponseDto,
  SearchResultItemDto,
} from './dto/search.dto';
import { DateTime } from 'luxon';

@Injectable()
export class SearchService {
  // 일단 redis 보류
  // userId -> string[] (LIFO, max 10)
  // TODO: Migrate to Redis? for production (persistent storage across server restarts)
  private recentSearches = new Map<string, string[]>();

  // userId -> (tag -> count)
  // TODO: Migrate to Redis? (ZSET or HASH with INCRBY)
  private tagFrequencies = new Map<string, Map<string, number>>();

  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
  ) {}

  async searchPosts(
    userId: string,
    dto: SearchPostsDto,
    cursor?: string,
    limit: number = 20,
  ): Promise<PaginatedSearchResponseDto> {
    if (dto.keyword) {
      this.saveRecentSearch(userId, dto.keyword);
    }
    if (dto.tags && dto.tags.length > 0) {
      this.trackTags(userId, dto.tags);
    }

    const isDateOnly = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value);
    let startDate = dto.startDate;
    let endDate = dto.endDate;

    if (startDate && !endDate) {
      if (isDateOnly(startDate)) {
        const startOfDay = DateTime.fromISO(startDate, {
          zone: 'Asia/Seoul',
        }).startOf('day');
        const endOfDay = startOfDay.endOf('day');
        startDate = startOfDay.toISO() ?? undefined;
        endDate = endOfDay.toISO() ?? undefined;
      } else {
        const startDt = DateTime.fromISO(startDate, { setZone: true });
        if (startDt.isValid) {
          endDate = startDt.endOf('day').toISO() ?? undefined;
        }
      }
    }
    const query = this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect(
        'post.postMedia',
        'postMedia',
        'postMedia.kind = :thumbnailKind',
        {
          thumbnailKind: PostMediaKind.THUMBNAIL,
        },
      )
      .leftJoinAndSelect('postMedia.media', 'media')
      .leftJoin('post.ownerUser', 'ownerUser')
      .where('post.ownerUserId = :userId', { userId }) // 기본적으로 내 글만 검색 (비즈니스 로직에 따라 변경 가능)
      .andWhere('post.deletedAt IS NULL');

    // Keyword Search (Title or Content Blocks)
    if (dto.keyword) {
      query.andWhere(
        new Brackets((qb) => {
          qb.where('post.title ILIKE :keyword', {
            keyword: `%${dto.keyword}%`,
          }).orWhere(
            "EXISTS (SELECT 1 FROM post_blocks pb WHERE pb.post_id = post.id AND pb.type = :textType AND pb.value->>'text' ILIKE :keyword)",
            { textType: PostBlockType.TEXT, keyword: `%${dto.keyword}%` },
          );
        }),
      );
    }

    // Date Range Search
    if (startDate) {
      query.andWhere('post.eventAt >= :startDate', {
        startDate,
      });
    }
    if (endDate) {
      query.andWhere('post.eventAt <= :endDate', { endDate });
    }

    // Tag Search
    if (dto.tags && dto.tags.length > 0) {
      query.andWhere('post.tags && :tags', { tags: dto.tags });
    }

    // Emotion Search
    if (dto.emotions && dto.emotions.length > 0) {
      query.andWhere('post.emotion && :emotions', { emotions: dto.emotions });
    }

    // Location Search (Nearby)
    if (dto.latitude !== undefined && dto.longitude !== undefined) {
      query.andWhere(
        'ST_DWithin(post.location, ST_SetSRID(ST_Point(:lng, :lat), 4326), :radius)',
        {
          lng: dto.longitude,
          lat: dto.latitude,
          radius: (dto.radius || 5) * 1000, // km to meters
        },
      );
    }

    // Cursor Pagination Logic
    this.applyCursor(query, cursor);

    // Sorting: Most recent first
    query.orderBy('post.eventAt', 'DESC').addOrderBy('post.id', 'DESC');

    // Limit + 1 to check for next page
    query.take(limit + 1);

    const posts = await query.getMany();

    const hasNextPage = posts.length > limit;
    const items = posts.slice(0, limit);

    const resultItems: SearchResultItemDto[] = await Promise.all(
      items.map(async (post) => {
        const firstImageBlock = await this.postRepository.manager.findOne(
          PostBlock,
          {
            where: { postId: post.id, type: PostBlockType.IMAGE },
            order: { layoutRow: 'ASC', layoutCol: 'ASC' },
            select: { id: true },
          },
        );
        const firstImageMedia = firstImageBlock
          ? await this.postRepository.manager.findOne(PostMedia, {
              where: {
                postId: post.id,
                kind: PostMediaKind.BLOCK,
                blockId: firstImageBlock.id,
              },
              order: { sortOrder: 'ASC', createdAt: 'ASC' },
              select: { mediaId: true },
            })
          : null;
        const firstImageMediaId = firstImageMedia?.mediaId;

        // Snippet extraction (first text block)
        const firstTextBlock = await this.postRepository.manager.findOne(
          PostBlock,
          {
            where: { postId: post.id, type: PostBlockType.TEXT },
            order: { layoutRow: 'ASC', layoutCol: 'ASC' },
          },
        );

        // Location Info from PostBlock if available
        const locationBlock = await this.postRepository.manager.findOne(
          PostBlock,
          {
            where: { postId: post.id, type: PostBlockType.LOCATION },
          },
        );

        return {
          id: post.id,
          thumbnailMediaId: firstImageMediaId,
          title: post.title,
          eventAt: post.eventAt!,
          location: locationBlock
            ? {
                address: (locationBlock.value as { address: string }).address,
                placeName: (locationBlock.value as { placeName?: string })
                  .placeName,
              }
            : undefined,
          snippet: firstTextBlock
            ? (firstTextBlock.value as { text: string }).text.substring(0, 100)
            : undefined,
        };
      }),
    );

    let nextCursor: string | undefined;
    if (hasNextPage) {
      const lastItem = items[items.length - 1];
      if (lastItem.eventAt) {
        nextCursor = this.encodeCursor(lastItem.eventAt, lastItem.id);
      }
    }

    return {
      items: resultItems,
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

  getRecentSearches(userId: string): string[] {
    // TODO: Fetch from Redis
    return this.recentSearches.get(userId) || [];
  }

  private saveRecentSearch(userId: string, keyword: string) {
    const trimmedKeyword = keyword.trim();
    if (!trimmedKeyword) return;

    let keywords = this.recentSearches.get(userId) || [];

    // Remove if already exists to move it to the top
    keywords = keywords.filter((k) => k !== trimmedKeyword);

    // Add to top
    keywords.unshift(trimmedKeyword);

    // Keep only top 10
    if (keywords.length > 10) {
      keywords = keywords.slice(0, 10);
    }

    // TODO: Save to Redis
    this.recentSearches.set(userId, keywords);
  }

  getTopTags(userId: string, limit: number = 10): string[] {
    // TODO: Fetch from Redis (ZREVRANGE)
    const frequencies = this.tagFrequencies.get(userId);
    if (!frequencies) return [];

    return Array.from(frequencies.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([tag]) => tag);
  }

  private trackTags(userId: string, tags: string[]) {
    // TODO: Use Redis INCRBY for each tag
    let userFrequencies = this.tagFrequencies.get(userId);
    if (!userFrequencies) {
      userFrequencies = new Map<string, number>();
      this.tagFrequencies.set(userId, userFrequencies);
    }

    for (const tag of tags) {
      const trimmedTag = tag.trim();
      if (!trimmedTag) continue;
      const count = userFrequencies.get(trimmedTag) || 0;
      userFrequencies.set(trimmedTag, count + 1);
    }
  }
}
