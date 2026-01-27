import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, Brackets } from 'typeorm';
import { Post } from '@/modules/post/entity/post.entity';
import { PostBlock } from '@/modules/post/entity/post-block.entity';
import { PostMediaKind } from '@/modules/post/entity/post-media.entity';
import { PostBlockType } from '@/enums/post-block-type.enum';
import {
  SearchPostsDto,
  PaginatedSearchResponseDto,
  SearchResultItemDto,
} from './dto/search.dto';

@Injectable()
export class SearchService {
  // userId -> string[] (LIFO, max 10)
  // TODO: Migrate to Redis for production (persistent storage across server restarts)
  private recentSearches = new Map<string, string[]>();

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
    if (dto.startDate) {
      query.andWhere('post.eventAt >= :startDate', {
        startDate: dto.startDate,
      });
    }
    if (dto.endDate) {
      query.andWhere('post.eventAt <= :endDate', { endDate: dto.endDate });
    }

    // Tag Search
    if (dto.tags && dto.tags.length > 0) {
      query.andWhere('post.tags && :tags', { tags: dto.tags });
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
        const thumbnail = post.postMedia?.[0]?.media;

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
          thumbnailUrl: thumbnail?.url,
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
}
