// src/modules/feed/feed.group.query.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, In, Repository } from 'typeorm';

import { Post } from '../post/entity/post.entity';
import { PostBlock } from '../post/entity/post-block.entity';
import { PostContributor } from '../post/entity/post-contributor.entity';
import { PostGroupShare } from '../post/entity/post-group-share.entity';
import { GroupMember } from '../group/entity/group_member.entity';
import { Group } from '../group/entity/group.entity';
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
    @InjectRepository(PostGroupShare)
    private readonly postGroupShareRepo: Repository<PostGroupShare>,
    @InjectRepository(GroupMember)
    private readonly groupMemberRepo: Repository<GroupMember>,
    @InjectRepository(Group)
    private readonly groupRepo: Repository<Group>,
    @InjectRepository(PostDraft)
    private readonly postDraftRepo: Repository<PostDraft>,
  ) {}

  async getGroupFeed(groupId: string, userId: string, query: GetFeedQueryDto) {
    const { from, to } = dayRange(query.date, query.tz ?? 'Asia/Seoul');

    const postsQb = this.postRepo.createQueryBuilder('p');
    postsQb.where(
      new Brackets((qb) => {
        qb.where('p.scope = :groupScope AND p.groupId = :groupId', {
          groupScope: PostScope.GROUP,
          groupId,
        }).orWhere(
          `EXISTS (SELECT 1 FROM post_group_shares pgs WHERE pgs.post_id = p.id AND pgs.group_id = :groupId AND pgs.deleted_at IS NULL)`,
        );
      }),
    );
    postsQb.andWhere('p.eventAt >= :from AND p.eventAt < :to', { from, to });

    postsQb.orderBy('p.eventAt', 'DESC').addOrderBy('p.id', 'DESC');
    postsQb.select([
      'p.id',
      'p.scope',
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
    const sharedContext = await this.resolveSharedContext(groupId, posts);

    return buildFeedCards(
      posts,
      this.postBlockRepo,
      this.postContributorRepo,
      this.groupMemberRepo,
      this.logger,
      userId,
      {
        draftRepo: this.postDraftRepo,
        sharedContext,
      },
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
    // getGroupFeed와 동일하게 "이 그룹 소속 글" OR "이 그룹에 공유된 개인 글"을
    // 함께 조회해야 한다 — 이 조건이 빠져 있어서 공유된 개인 글이 그룹
    // 무한스크롤 피드에는 전혀 안 뜨던 버그가 있었다(day 뷰에서만 보임).
    postsQb.where(
      new Brackets((qb) => {
        qb.where('p.scope = :groupScope AND p.groupId = :groupId', {
          groupScope: PostScope.GROUP,
          groupId,
        }).orWhere(
          `EXISTS (SELECT 1 FROM post_group_shares pgs WHERE pgs.post_id = p.id AND pgs.group_id = :groupId AND pgs.deleted_at IS NULL)`,
        );
      }),
    );
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
      'p.scope',
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
    const sharedContext = await this.resolveSharedContext(groupId, posts);
    const { cards, warnings } = await buildFeedCards(
      posts,
      this.postBlockRepo,
      this.postContributorRepo,
      this.groupMemberRepo,
      this.logger,
      userId,
      { draftRepo: this.postDraftRepo, sharedContext },
    );

    const lastPost = posts[posts.length - 1];
    const nextCursor =
      posts.length === limit && lastPost?.eventAt
        ? encodeFeedCursor(new Date(lastPost.eventAt), lastPost.id)
        : null;

    return { cards, warnings, nextCursor };
  }

  // 조회된 posts 중 이 그룹에 공유된 개인 글을 가려내 buildFeedCards의
  // sharedContext로 넘길 형태로 만든다. getGroupFeed/getPastFeedForGroup 공용.
  private async resolveSharedContext(groupId: string, posts: Post[]) {
    const personalPostIds = posts
      .filter((p) => p.scope === PostScope.PERSONAL)
      .map((p) => p.id);
    const shares = personalPostIds.length
      ? await this.postGroupShareRepo.find({
          where: { groupId, postId: In(personalPostIds) },
          select: { postId: true },
        })
      : [];
    const sharedPostIds = new Set(shares.map((s) => s.postId));

    const group =
      sharedPostIds.size > 0
        ? await this.groupRepo.findOne({
            where: { id: groupId },
            select: ['id', 'name'],
          })
        : null;

    return { groupId, groupName: group?.name ?? null, sharedPostIds };
  }
}
