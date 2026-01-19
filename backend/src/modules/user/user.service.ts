import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, In, Repository, SelectQueryBuilder } from 'typeorm';
import { User } from './user.entity';
import { Post } from '../post/entity/post.entity';
import { PostBlock } from '../post/entity/post-block.entity';
import { MonthRecordResponseDto } from './dto/month-record.response.dto';
import { DateTime } from 'luxon';
import { PostBlockType } from '@/enums/post-block-type.enum';
import { BlockValueMap } from '@/modules/post/types/post-block.types';
import { PostContributor } from '../post/entity/post-contributor.entity';

import type { OAuthUserType } from '@/modules/auth/auth.type';

// User Service에서 기능 구현
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Post)
    private readonly postRepo: Repository<Post>,
    @InjectRepository(PostBlock)
    private readonly postBlockRepo: Repository<PostBlock>,
  ) {}

  async findOrCreateOAuthUser(params: OAuthUserType): Promise<User> {
    const { provider, providerId } = params;

    let user = await this.userRepo.findOne({
      where: { provider, providerId },
    });

    if (!user) {
      user = this.userRepo.create(params);

      await this.userRepo.save(user);
    }

    return user;
  }

  /**
   * 월별 기록(아카이브) 조회
   */
  async getMonthlyArchive(
    userId: string,
    year: number,
  ): Promise<MonthRecordResponseDto[]> {
    // 1. 조회 기간 설정 (YYYY-01-01 ~ YYYY-12-31)
    // 타임존은 일단 KST/UTC 이슈 없이 "해당 연도에 포함된" 모든 글을 가져온 뒤 JS에서 월별로 그룹핑하는 전략
    // (DB Timezone issue를 피하기 위해 넉넉하게 가져와서 application level grouping)
    const startDate = DateTime.fromObject({ year, month: 1, day: 1 }).startOf(
      'year',
    );
    const endDate = startDate.endOf('year');

    const from = startDate.toJSDate();
    const to = endDate.toJSDate();

    // 2. 해당 유저의 모든 포스트 조회 (내 글 + 기여한 글)
    const postsQb = this.postRepo.createQueryBuilder('p');
    postsQb.select(['p.id', 'p.eventAt', 'p.title']);

    // 조건: (ownerUserId = :userId OR contributor...) AND eventAt BETWEEN :from AND :to
    postsQb.where(
      new Brackets((qb) => {
        qb.where('p.ownerUserId = :userId', { userId }).orWhere(
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

    postsQb.andWhere('p.eventAt >= :from AND p.eventAt <= :to', { from, to });
    postsQb.orderBy('p.eventAt', 'DESC'); // 최신순 정렬

    const posts = await postsQb.getMany();

    if (posts.length === 0) {
      return [];
    }

    // 3. 월별 그룹핑
    // Key: "YYYY-MM", Value: Post[]
    const postsByMonth = new Map<string, Post[]>();

    for (const p of posts) {
      if (!p.eventAt) continue;
      // eventAt은 UTC로 저장됨. 클라이언트 뷰 기준(User TZ)이 중요하지만,
      // 일단 간단히 KST(+9) 기준 or 그냥 UTC 기준으로 월을 자른다.
      // 여기서는 요구사항에 맞춰 "YYYY-MM" 문자열 생성이 필요.
      // Luxon을 사용하여 포맷팅 (default zone or system zone?)
      // User의 Timezone을 알 수 없으므로, 일단 Asia/Seoul 기준으로 Grouping 하거나 UTC 등 합의 필요.
      // 코드 맥락상 Default TZ를 따르거나 함. 여기서는 KST(Asia/Seoul) 가정.
      const dt = DateTime.fromJSDate(p.eventAt).setZone('Asia/Seoul');
      const monthKey = dt.toFormat('yyyy-MM');

      const list = postsByMonth.get(monthKey) ?? [];
      list.push(p);
      postsByMonth.set(monthKey, list);
    }

    // 4. 각 월별 "대표(최신) 포스트 ID" 추출
    const monthKeys = Array.from(postsByMonth.keys()).sort().reverse(); // 최신 달부터
    const representativePostIds: string[] = [];
    const representativePostMap = new Map<string, Post>(); // postId -> Post(latest)

    // 결과 조립용 Map
    // MonthKey -> PartialResult
    const resultFromMonth = new Map<
      string,
      {
        postCount: number;
        latestPost: Post;
      }
    >();

    for (const mKey of monthKeys) {
      const monthPosts = postsByMonth.get(mKey)!;
      // 이미 쿼리에서 eventAt DESC 정렬했으므로 첫번째가 최신
      const latestPost = monthPosts[0];

      resultFromMonth.set(mKey, {
        postCount: monthPosts.length,
        latestPost,
      });

      representativePostIds.push(latestPost.id);
      representativePostMap.set(latestPost.id, latestPost);
    }

    // 5. 대표 포스트들의 메타데이터(이미지, 위치) 조회 (Batch)
    // 필요한 Block Type: IMAGE(썸네일용), LOCATION(장소명용)
    const blocks = await this.postBlockRepo.find({
      where: {
        postId: In(representativePostIds),
        type: In([PostBlockType.IMAGE, PostBlockType.LOCATION]),
      },
    });

    const blocksByPostId = new Map<string, PostBlock[]>();
    for (const b of blocks) {
      const list = blocksByPostId.get(b.postId) ?? [];
      list.push(b);
      blocksByPostId.set(b.postId, list);
    }

    // 6. DTO 조립
    const results: MonthRecordResponseDto[] = [];
    for (const mKey of monthKeys) {
      const { postCount, latestPost } = resultFromMonth.get(mKey)!;
      const relatedBlocks = blocksByPostId.get(latestPost.id) ?? [];

      // 6-1. 커버 이미지 찾기 (IMAGE 블록 중 첫번째 or 특정 로직)
      const imageBlock = relatedBlocks.find(
        (b) => b.type === PostBlockType.IMAGE,
      );
      let coverUrl: string | null = null;
      if (imageBlock) {
        const val =
          imageBlock.value as BlockValueMap[typeof PostBlockType.IMAGE];
        // tempUrls or mediaIds... usually we want a usable URL.
        // Assuming tempUrls has valid URLs or we need to process mediaIds.
        // For simplicity, take first of tempUrls if available.
        if (val.tempUrls && val.tempUrls.length > 0) {
          coverUrl = val.tempUrls[0];
        }
      }

      // 6-2. 위치 이름 찾기
      const locationBlock = relatedBlocks.find(
        (b) => b.type === PostBlockType.LOCATION,
      );
      let placeName: string | null = null;
      if (locationBlock) {
        const val =
          locationBlock.value as BlockValueMap[typeof PostBlockType.LOCATION];
        placeName = val.placeName || val.address || null;
      }

      results.push({
        month: mKey,
        count: postCount,
        coverUrl,
        latestTitle: latestPost.title,
        latestLocation: placeName,
      });
    }

    return results;
  }
}
