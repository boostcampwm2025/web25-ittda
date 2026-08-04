// src/modules/feed/feed.group.query.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Post } from '../post/entity/post.entity';
import { PostBlock } from '../post/entity/post-block.entity';
import { PostContributor } from '../post/entity/post-contributor.entity';
import { GroupMember } from '../group/entity/group_member.entity';
import { PostScope } from '@/enums/post-scope.enum';
import { PostDraft } from '../post/entity/post-draft.entity';
import { GetFeedQueryDto } from './dto/get-feed.query.dto';
import {
  buildFeedCards,
  dayRange,
  decodeFeedCursor,
  encodeFeedCursor,
} from './feed.helpers';

@Injectable()
export class FeedGroupQueryService {
  private readonly logger = new Logger(FeedGroupQueryService.name);

  constructor(
    @InjectRepository(Post)
    private readonly postRepo: Repository<Post>,
    @InjectRepository(PostBlock)
    private readonly postBlockRepo: Repository<PostBlock>,
    @InjectRepository(PostContributor)
    private readonly postContributorRepo: Repository<PostContributor>,
    @InjectRepository(GroupMember)
    private readonly groupMemberRepo: Repository<GroupMember>,
    @InjectRepository(PostDraft)
    private readonly postDraftRepo: Repository<PostDraft>,
  ) {}

  async getGroupFeed(groupId: string, userId: string, query: GetFeedQueryDto) {
    const { from, to } = dayRange(query.date, query.tz ?? 'Asia/Seoul');

    const postsQb = this.postRepo.createQueryBuilder('p');
    postsQb.where('p.scope = :scope', { scope: PostScope.GROUP });
    postsQb.andWhere('p.groupId = :groupId', { groupId });
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
    return buildFeedCards(
      posts,
      this.postBlockRepo,
      this.postContributorRepo,
      this.groupMemberRepo,
      this.logger,
      userId,
      { draftRepo: this.postDraftRepo },
    );
  }

  // getGroupFeed와 동일한 그룹 스코프 필터를 쓰되, 하루 단위 대신 eventAt
  // 커서로 계속 더 과거로 페이지네이션하는 "지난 기록" 무한스크롤 피드.
  async getPastFeedForGroup(
    groupId: string,
    userId: string,
    cursor?: string,
    limit = 10,
  ) {
    const decodedCursor = decodeFeedCursor(cursor);

    const postsQb = this.postRepo.createQueryBuilder('p');
    postsQb.where('p.scope = :scope', { scope: PostScope.GROUP });
    postsQb.andWhere('p.groupId = :groupId', { groupId });
    if (decodedCursor) {
      postsQb.andWhere(
        '(p.eventAt < :cursorEventAt OR (p.eventAt = :cursorEventAt AND p.id < :cursorId))',
        { cursorEventAt: decodedCursor.eventAt, cursorId: decodedCursor.id },
      );
    }

    postsQb.orderBy('p.eventAt', 'DESC').addOrderBy('p.id', 'DESC');
    postsQb.take(limit);

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
    const { cards, warnings } = await buildFeedCards(
      posts,
      this.postBlockRepo,
      this.postContributorRepo,
      this.groupMemberRepo,
      this.logger,
      userId,
      { draftRepo: this.postDraftRepo },
    );

    const lastPost = posts[posts.length - 1];
    const nextCursor =
      posts.length === limit && lastPost?.eventAt
        ? encodeFeedCursor(new Date(lastPost.eventAt), lastPost.id)
        : null;

    return { cards, warnings, nextCursor };
  }
}
