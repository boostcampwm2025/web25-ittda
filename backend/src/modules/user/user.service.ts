import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, In, Repository, SelectQueryBuilder } from 'typeorm';
import { User } from './entity/user.entity';
import { Post } from '../post/entity/post.entity';
import { PostBlock } from '../post/entity/post-block.entity';
import { MonthRecordResponseDto } from './dto/month-record.response.dto';
import { DateTime } from 'luxon';
import { PostBlockType } from '@/enums/post-block-type.enum';
import { BlockValueMap } from '@/modules/post/types/post-block.types';
import { PostContributor } from '../post/entity/post-contributor.entity';

import type { OAuthUserType } from '@/modules/auth/auth.type';

import { UserMonthCover } from './entity/user-month-cover.entity';

import { DayRecordResponseDto } from './dto/day-record.response.dto';

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
    @InjectRepository(UserMonthCover)
    private readonly userMonthCoverRepo: Repository<UserMonthCover>,
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
   * ID로 유저 단건 조회 (기본)
   */
  async findById(id: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { id } });
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

    // 3.5 커버 이미지 매핑 조회 (UserMonthCover)
    const customCovers = await this.userMonthCoverRepo.find({
      where: { userId, year },
    });
    const customCoverMap = new Map<string, string>(); // "yyyy-MM" -> url
    for (const c of customCovers) {
      const key = `${c.year}-${c.month.toString().padStart(2, '0')}`;
      customCoverMap.set(key, c.coverAssetId ?? '');
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

      // 6-1. 커버 이미지 찾기 (AssetID 사용)
      // 우선순위: 1. UserSelected 2. Latest Post Image
      let coverAssetId: string | null = null;

      const customId = customCoverMap.get(mKey);
      if (customId) {
        coverAssetId = customId;
      } else {
        const imageBlock = relatedBlocks.find(
          (b) => b.type === PostBlockType.IMAGE,
        );
        if (imageBlock) {
          const val =
            imageBlock.value as BlockValueMap[typeof PostBlockType.IMAGE];
          if (val.mediaIds && val.mediaIds.length > 0) {
            coverAssetId = val.mediaIds[0];
          }
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
        coverAssetId,
        latestTitle: latestPost.title,
        latestLocation: placeName,
      });
    }

    return results;
  }

  /**
   * 해당 월의 모든 이미지 조회
   */
  async getMonthImages(
    userId: string,
    year: number,
    month: number,
  ): Promise<string[]> {
    const from = DateTime.fromObject({ year, month, day: 1 }).startOf('month');
    const to = from.endOf('month');

    // 해당 기간, 내 글(owner)에서 나온 IMAGE 블록 조회
    // Contributor 글의 이미지도 내 앨범에 넣을지는 정책 결정 필요.
    // "내 기록함" 맥락이므로 내가 포함된 글의 이미지는 쓸 수 있다고 가정.
    // 여기서는 QueryBuilder로 Join하여 한 번에 가져옴.

    const fromDate = from.toJSDate();
    const toDate = to.toJSDate();

    // Post p JOIN PostBlock b ON p.id = b.postId
    // WHERE ... AND b.type = 'IMAGE'
    const qb = this.postBlockRepo.createQueryBuilder('b');
    qb.innerJoin('b.post', 'p');

    // Auth Check Logic reuse needed?
    // Simply check owner for now (Optimization) OR reuse complicated logic if needed.
    // Scenario implies "My Archive", so owner + contributor.

    qb.where('b.type = :type', { type: PostBlockType.IMAGE });
    qb.andWhere('p.eventAt >= :fromDate AND p.eventAt <= :toDate', {
      fromDate,
      toDate,
    });

    qb.andWhere(
      new Brackets((sub) => {
        sub.where('p.ownerUserId = :userId', { userId }).orWhere(
          (subQb: SelectQueryBuilder<Post>) => {
            const sub2 = subQb
              .subQuery()
              .select('1')
              .from(PostContributor, 'pc')
              .where('pc.postId = p.id')
              .andWhere('pc.userId = :userId')
              .getQuery();
            return `EXISTS ${sub2}`;
          },
          { userId },
        );
      }),
    );

    // 최신순
    qb.orderBy('p.eventAt', 'DESC');

    const blocks = await qb.getMany();

    // Extract Asset IDs
    const assetIds: string[] = [];
    for (const b of blocks) {
      const val = b.value as BlockValueMap[typeof PostBlockType.IMAGE];
      if (val.mediaIds) {
        assetIds.push(...val.mediaIds);
      }
    }

    return assetIds;
  }

  /**
   * 월별 커버 이미지 변경
   */
  async updateMonthCover(
    userId: string,
    year: number,
    month: number,
    coverAssetId: string,
  ) {
    // Upsert
    const exist = await this.userMonthCoverRepo.findOne({
      where: { userId, year, month },
    });

    if (exist) {
      exist.coverAssetId = coverAssetId;
      await this.userMonthCoverRepo.save(exist);
    } else {
      const newCover = this.userMonthCoverRepo.create({
        userId,
        year,
        month,
        coverAssetId,
      });
      await this.userMonthCoverRepo.save(newCover);
    }
  }

  /**
   * 일별 기록(아카이브) 조회 - 달력용
   */
  async getDailyArchive(
    userId: string,
    year: number,
    month: number,
  ): Promise<DayRecordResponseDto[]> {
    const start = DateTime.fromObject({ year, month, day: 1 }).startOf('month');
    const end = start.endOf('month');

    const fromDate = start.toJSDate();
    const toDate = end.toJSDate();

    // 1. 해당 월의 모든 포스트 조회 (내 글 + 기여)
    const postsQb = this.postRepo.createQueryBuilder('p');
    postsQb.select(['p.id', 'p.eventAt', 'p.title']);

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

    postsQb.andWhere('p.eventAt >= :fromDate AND p.eventAt <= :toDate', {
      fromDate,
      toDate,
    });
    postsQb.orderBy('p.eventAt', 'DESC');

    const posts = await postsQb.getMany();
    if (posts.length === 0) {
      return [];
    }

    // 2. 일별 그룹핑 (YYYY-MM-DD)
    const postsByDay = new Map<string, Post[]>();
    for (const p of posts) {
      if (!p.eventAt) continue;
      // KST(Asia/Seoul) 가정
      const dt = DateTime.fromJSDate(p.eventAt).setZone('Asia/Seoul');
      const dayKey = dt.toFormat('yyyy-MM-dd');

      const list = postsByDay.get(dayKey) ?? [];
      list.push(p);
      postsByDay.set(dayKey, list);
    }

    // 3. 각 일별 대표 포스트(최신) 추출
    const dayKeys = Array.from(postsByDay.keys()).sort().reverse(); // 날짜 내림차순(최신순)
    const representativePostIds: string[] = [];
    const resultFromDay = new Map<
      string,
      {
        postCount: number;
        latestPost: Post;
      }
    >();

    for (const dKey of dayKeys) {
      const dayPosts = postsByDay.get(dKey)!;
      // 쿼리에서 eventAt DESC 였으므로 첫번째가 최신
      const latestPost = dayPosts[0];
      resultFromDay.set(dKey, {
        postCount: dayPosts.length,
        latestPost,
      });
      representativePostIds.push(latestPost.id);
    }

    // 4. 대표 포스트 메타데이터(이미지, 위치) Batch 조회
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

    // 5. DTO 조립
    const results: DayRecordResponseDto[] = [];
    for (const dKey of dayKeys) {
      const { postCount, latestPost } = resultFromDay.get(dKey)!;
      const relatedBlocks = blocksByPostId.get(latestPost.id) ?? [];

      // 커버 이미지
      let coverAssetId: string | null = null;
      const imageBlock = relatedBlocks.find(
        (b) => b.type === PostBlockType.IMAGE,
      );
      if (imageBlock) {
        const val =
          imageBlock.value as BlockValueMap[typeof PostBlockType.IMAGE];
        if (val.mediaIds && val.mediaIds.length > 0) {
          coverAssetId = val.mediaIds[0];
        }
      }

      // 위치 이름
      let latestPlaceName: string | null = null;
      const locationBlock = relatedBlocks.find(
        (b) => b.type === PostBlockType.LOCATION,
      );
      if (locationBlock) {
        const val =
          locationBlock.value as BlockValueMap[typeof PostBlockType.LOCATION];
        latestPlaceName = val.placeName || val.address || null;
      }

      results.push({
        date: dKey,
        postCount,
        coverAssetId,
        latestPostTitle: latestPost.title,
        latestPlaceName,
      });
    }

    // 날짜 오름차순 정렬되어 있음
    return results;
  }

  /**
   * 해당 연도의 모든 이미지(월 커버 후보) 조회
   */
  async getYearlyImages(userId: string, year: number): Promise<string[]> {
    const start = DateTime.fromObject({ year, month: 1, day: 1 }).startOf(
      'year',
    );
    const end = start.endOf('year');
    const fromDate = start.toJSDate();
    const toDate = end.toJSDate();

    // 1. 해당 연도의 내 포스트(기여 포함) IDs 조회
    const postsQb = this.postRepo.createQueryBuilder('p');
    postsQb.select('p.id');

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
    postsQb.andWhere('p.eventAt >= :fromDate AND p.eventAt <= :toDate', {
      fromDate,
      toDate,
    });
    // 최신순 정렬
    postsQb.orderBy('p.eventAt', 'DESC');

    const posts = await postsQb.getMany();
    if (posts.length === 0) {
      return [];
    }
    const postIds = posts.map((p) => p.id);

    // 2. 이미지 블록 조회
    const blocks = await this.postBlockRepo.find({
      where: {
        postId: In(postIds),
        type: PostBlockType.IMAGE,
      },
      order: {
        // 같은 포스트 내에서는 순서대로
        layoutRow: 'ASC',
        layoutCol: 'ASC',
      },
    });

    // 3. mediaIds 추출 평탄화
    const assetIds: string[] = [];
    for (const b of blocks) {
      const val = b.value as BlockValueMap[typeof PostBlockType.IMAGE];
      if (val.mediaIds) {
        assetIds.push(...val.mediaIds);
      }
    }

    return assetIds;
  }

  /**
   * 해당 월 중 기록(게시글)이 있는 날짜 조회 (YYYY-MM-DD)
   */
  async getRecordedDays(
    userId: string,
    year: number,
    month: number,
  ): Promise<string[]> {
    const start = DateTime.fromObject({ year, month, day: 1 }).startOf('month');
    const end = start.endOf('month');
    const fromDate = start.toJSDate();
    const toDate = end.toJSDate();

    const postsQb = this.postRepo.createQueryBuilder('p');
    postsQb.select('p.eventAt');

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

    postsQb.andWhere('p.eventAt >= :fromDate AND p.eventAt <= :toDate', {
      fromDate,
      toDate,
    });
    postsQb.orderBy('p.eventAt', 'DESC');

    const posts = await postsQb.getMany();
    const dateSet = new Set<string>();

    for (const p of posts) {
      if (!p.eventAt) continue;
      // KST 기준 날짜 추출
      const dt = DateTime.fromJSDate(p.eventAt).setZone('Asia/Seoul');
      dateSet.add(dt.toFormat('yyyy-MM-dd'));
    }

    // 최신순 정렬
    return Array.from(dateSet).sort().reverse();
  }
}
