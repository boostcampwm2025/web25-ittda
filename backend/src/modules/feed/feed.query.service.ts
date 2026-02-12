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
import { PostDraft } from '../post/entity/post-draft.entity';
import { buildFeedCards, dayRange } from './feed.helpers';

/**
 * 사용자 피드 조회를 위한 읽기 전용 쿼리를 담당한다.
 */
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
    @InjectRepository(PostDraft)
    private readonly postDraftRepo: Repository<PostDraft>,
  ) {}

  /**
   * 특정 사용자 기준으로 피드 카드를 조회한다.
   * contributor(AUTHOR/EDITOR) 조건과 날짜 범위를 반영해 게시글을 가져온 뒤,
   * 피드 카드 DTO 및 경고 정보로 조합한다.
   *
   * @param userId 피드를 조회하는 사용자 ID
   * @param query 조회 조건(날짜, 타임존)
   * @returns 피드 카드 목록과 경고 목록
   * @throws {BadRequestException} date 또는 tz 값이 유효하지 않은 경우
   */
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
      {
        includeGroupName: true,
        groupRepo: this.groupRepo,
        draftRepo: this.postDraftRepo,
      },
    );
  }
}
