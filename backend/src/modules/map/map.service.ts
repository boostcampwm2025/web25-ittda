import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, Brackets } from 'typeorm';
import type { Point } from 'geojson';
import { Post } from '@/modules/post/entity/post.entity';
import { PostBlock } from '@/modules/post/entity/post-block.entity';
import { PostMediaKind } from '@/modules/post/entity/post-media.entity';
import { PostBlockType } from '@/enums/post-block-type.enum';
import {
  MapPostsQueryDto,
  PaginatedMapPostsResponseDto,
  MapPostItemDto,
} from './dto/map-query.dto';

@Injectable()
export class MapService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
  ) {}

  async findPostsWithinRadius(
    userId: string,
    queryDto: MapPostsQueryDto,
  ): Promise<PaginatedMapPostsResponseDto> {
    const { lat, lng, radius, from, to, tags, cursor, limit = 20 } = queryDto;

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
      .where('post.ownerUserId = :userId', { userId })
      .andWhere('post.deletedAt IS NULL')
      .andWhere(
        'ST_DWithin(post.location, ST_SetSRID(ST_Point(:lng, :lat), 4326), :radius)',
        {
          lng,
          lat,
          radius,
        },
      );

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

    const resultItems: MapPostItemDto[] = await Promise.all(
      items.map(async (post) => {
        const thumbnail = post.postMedia?.[0]?.media;

        // Find location block for placeName/address
        const locationBlock = await this.postRepository.manager.findOne(
          PostBlock,
          {
            where: { postId: post.id, type: PostBlockType.LOCATION },
          },
        );

        let placeDisplay: string | undefined;
        if (locationBlock) {
          const val = locationBlock.value as {
            address: string;
            placeName?: string;
          };
          placeDisplay = val.placeName || val.address;
        }

        return {
          id: post.id,
          lat: (post.location as Point).coordinates[1],
          lng: (post.location as Point).coordinates[0],
          title: post.title,
          thumbnailUrl: thumbnail?.url,
          createdAt: post.eventAt || post.createdAt,
          tags: post.tags || [],
          placeName: placeDisplay,
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
}
