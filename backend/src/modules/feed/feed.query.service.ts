// src/modules/feed/feed.query.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository, SelectQueryBuilder } from 'typeorm';

import { Post } from '../post/entity/post.entity';
import { GetFeedQueryDto } from './dto/get-feed.query.dto';
import { PostContributor } from '../post/entity/post-contributor.entity';
import { PostBlock } from '../post/entity/post-block.entity';
import { GroupMember } from '../group/entity/group_member.entity';
import { Group } from '../group/entity/group.entity';
import { buildFeedCards, dayRange } from './feed.helpers';

@Injectable()
export class FeedQueryService {
  private readonly logger = new Logger(FeedQueryService.name);

  constructor(
    @InjectRepository(Post)
    private readonly postRepo: Repository<Post>,
    @InjectRepository(PostBlock)
    private readonly postBlockRepo: Repository<PostBlock>,
    @InjectRepository(PostContributor)
    private readonly postContributorRepo: Repository<PostContributor>,
    @InjectRepository(GroupMember)
    private readonly groupMemberRepo: Repository<GroupMember>,
    @InjectRepository(Group)
    private readonly groupRepo: Repository<Group>,
  ) {}

  async getFeedForUser(userId: string, query: GetFeedQueryDto) {
    // 날짜 필터링을 위해 date 파싱
    const { from, to } = dayRange(query.date, query.tz ?? 'Asia/Seoul');

    // 1) posts 조회
    // - contributor 기반 피드 (작성/편집 참여 글)
    const postsQb = this.postRepo.createQueryBuilder('p');

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
    if (from && to) {
      postsQb.andWhere('p.eventAt >= :from AND p.eventAt < :to', { from, to });
    }

    // 정렬 정책은 일단 최신순
    postsQb.orderBy('p.eventAt', 'DESC').addOrderBy('p.id', 'DESC');

    postsQb.select([
      'p.id',
      'p.groupId',
      'p.ownerUserId',
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
    return buildFeedCards(
      posts,
      this.postBlockRepo,
      this.postContributorRepo,
      this.groupMemberRepo,
      this.logger,
      userId,
      { includeGroupName: true, groupRepo: this.groupRepo },
    );
  }
}
