// src/modules/feed/feed.group.query.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Post } from '../post/entity/post.entity';
import { PostBlock } from '../post/entity/post-block.entity';
import { PostScope } from '@/enums/post-scope.enum';
import { GetFeedQueryDto } from './dto/get-feed.query.dto';
import { buildFeedCards, dayRange } from './feed.helpers';

@Injectable()
export class FeedGroupQueryService {
  private readonly logger = new Logger(FeedGroupQueryService.name);

  constructor(
    @InjectRepository(Post)
    private readonly postRepo: Repository<Post>,
    @InjectRepository(PostBlock)
    private readonly postBlockRepo: Repository<PostBlock>,
  ) {}

  async getGroupFeed(groupId: string, query: GetFeedQueryDto) {
    const { from, to } = dayRange(query.date, query.tz ?? 'Asia/Seoul');

    const postsQb = this.postRepo.createQueryBuilder('p');
    postsQb.where('p.scope = :scope', { scope: PostScope.GROUP });
    postsQb.andWhere('p.groupId = :groupId', { groupId });
    postsQb.andWhere('p.eventAt >= :from AND p.eventAt < :to', { from, to });

    postsQb.orderBy('p.eventAt', 'DESC').addOrderBy('p.id', 'DESC');
    postsQb.select([
      'p.id',
      'p.groupId',
      'p.eventAt',
      'p.createdAt',
      'p.updatedAt',
      'p.title',
      'p.tags',
      'p.emotion',
      'p.rating',
    ]);

    const posts = await postsQb.getMany();
    return buildFeedCards(posts, this.postBlockRepo, this.logger);
  }
}
