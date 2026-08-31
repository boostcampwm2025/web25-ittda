// src/modules/feed/feed.personal.query.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Post } from '../post/entity/post.entity';
import { PostBlock } from '../post/entity/post-block.entity';
import { PostContributor } from '../post/entity/post-contributor.entity';
import { PostGroupShare } from '../post/entity/post-group-share.entity';
import { GroupMember } from '../group/entity/group_member.entity';
import { PostScope } from '@/enums/post-scope.enum';
import { GetFeedQueryDto } from './dto/get-feed.query.dto';
import {
  buildFeedCards,
  dayRange,
  getSharedGroupsByPostIds,
} from './feed.helpers';

@Injectable()
export class FeedPersonalQueryService {
  private readonly logger = new Logger(FeedPersonalQueryService.name);

  constructor(
    @InjectRepository(Post)
    private readonly postRepo: Repository<Post>,
    @InjectRepository(PostBlock)
    private readonly postBlockRepo: Repository<PostBlock>,
    @InjectRepository(PostContributor)
    private readonly postContributorRepo: Repository<PostContributor>,
    @InjectRepository(PostGroupShare)
    private readonly postGroupShareRepo: Repository<PostGroupShare>,
    @InjectRepository(GroupMember)
    private readonly groupMemberRepo: Repository<GroupMember>,
  ) {}

  async getPersonalFeedForUser(userId: string, query: GetFeedQueryDto) {
    const { from, to } = dayRange(query.date, query.tz ?? 'Asia/Seoul');

    const postsQb = this.postRepo.createQueryBuilder('p');
    postsQb.where('p.scope = :scope', { scope: PostScope.PERSONAL });
    postsQb.andWhere('p.ownerUserId = :userId', { userId });
    postsQb.andWhere('p.eventAt >= :from AND p.eventAt < :to', { from, to });

    postsQb.orderBy('p.eventAt', 'DESC').addOrderBy('p.id', 'DESC');
    postsQb.select([
      'p.id',
      'p.groupId',
      'p.ownerUserId',
      'p.eventAt',
      'p.createdAt',
      'p.updatedAt',
      'p.title',
      'p.tags',
      'p.emotion',
      'p.rating',
    ]);

    const posts = await postsQb.getMany();

    // 본인 소유 PERSONAL 글만 조회하는 쿼리라 postIds 전체가 이미 owner 검증됨.
    const sharedGroupsByPostId = await getSharedGroupsByPostIds(
      this.postGroupShareRepo,
      posts.map((p) => p.id),
    );

    return buildFeedCards(
      posts,
      this.postBlockRepo,
      this.postContributorRepo,
      this.groupMemberRepo,
      this.logger,
      userId,
      { sharedGroupsByPostId },
    );
  }
}
