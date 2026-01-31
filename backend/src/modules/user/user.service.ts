import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, In, Repository, SelectQueryBuilder } from 'typeorm';
import { User } from './entity/user.entity';
import { Post } from '../post/entity/post.entity';
import { PostBlock } from '../post/entity/post-block.entity';
import { PostMedia, PostMediaKind } from '../post/entity/post-media.entity';
import { MonthRecordResponseDto } from './dto/month-record.response.dto';
import { DateTime } from 'luxon';
import { PostBlockType } from '@/enums/post-block-type.enum';
import { BlockValueMap } from '@/modules/post/types/post-block.types';
import { PostContributor } from '../post/entity/post-contributor.entity';
import { PostScope } from '@/enums/post-scope.enum';

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
    @InjectRepository(PostMedia)
    private readonly postMediaRepo: Repository<PostMedia>,
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

    // 2. 해당 유저의 PERSONAL 포스트 조회 (내 글만)
    const postsQb = this.postRepo.createQueryBuilder('p');
    postsQb.select(['p.id', 'p.eventAt', 'p.title']);

    postsQb.where('p.ownerUserId = :userId', { userId });
    postsQb.andWhere('p.scope = :scope', { scope: PostScope.PERSONAL });

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
   * 사용자 월별 커버 후보 이미지 조회 (날짜별 그룹화)
   */
  async getMonthCoverCandidates(userId: string, year: number, month: number) {
    const from = DateTime.fromObject({ year, month, day: 1 }).startOf('month');
    const to = from.endOf('month');

    const fromDate = from.toJSDate();
    const toDate = to.toJSDate();

    const qb = this.postMediaRepo.createQueryBuilder('pm');
    qb.innerJoin('pm.post', 'p');
    qb.leftJoin('pm.media', 'ma');
    qb.select([
      'pm.id',
      'pm.mediaId',
      'pm.kind',
      'p.id',
      'p.title',
      'p.eventAt',
      'ma.width',
      'ma.height',
      'ma.mimeType',
    ]);
    qb.where('pm.kind = :kind', { kind: PostMediaKind.BLOCK });
    qb.andWhere('p.eventAt >= :fromDate AND p.eventAt <= :toDate', {
      fromDate,
      toDate,
    });
    qb.andWhere('p.scope = :scope', { scope: PostScope.PERSONAL });
    qb.andWhere('p.ownerUserId = :userId', { userId });
    qb.orderBy('p.eventAt', 'DESC');
    qb.addOrderBy('pm.id', 'DESC');

    const mediaList = await qb.getMany();

    const items = mediaList.map((pm) => ({
      mediaId: pm.mediaId,
      postId: pm.post.id,
      postTitle: pm.post.title,
      eventAt: pm.post.eventAt!,
      width: pm.media?.width,
      height: pm.media?.height,
      mimeType: pm.media?.mimeType,
    }));

    const sectionsMap = new Map<string, typeof items>();
    for (const item of items) {
      const dateStr = DateTime.fromJSDate(item.eventAt)
        .setZone('Asia/Seoul')
        .toFormat('yyyy-MM-dd');
      if (!sectionsMap.has(dateStr)) {
        sectionsMap.set(dateStr, []);
      }
      sectionsMap.get(dateStr)!.push(item);
    }

    const sections = Array.from(sectionsMap.entries()).map(([date, list]) => ({
      date,
      items: list,
    }));

    return {
      userId,
      sections,
      pageInfo: {
        hasNext: false,
        nextCursor: null,
      },
    };
  }

  private async getMonthCoverAssetIds(
    userId: string,
    year: number,
    month: number,
  ): Promise<string[]> {
    const from = DateTime.fromObject({ year, month, day: 1 }).startOf('month');
    const to = from.endOf('month');

    const fromDate = from.toJSDate();
    const toDate = to.toJSDate();

    const qb = this.postMediaRepo.createQueryBuilder('pm');
    qb.innerJoin('pm.post', 'p');
    qb.select(['pm.mediaId']);
    qb.where('pm.kind = :kind', { kind: PostMediaKind.BLOCK });
    qb.andWhere('p.eventAt >= :fromDate AND p.eventAt <= :toDate', {
      fromDate,
      toDate,
    });
    qb.andWhere('p.scope = :scope', { scope: PostScope.PERSONAL });
    qb.andWhere('p.ownerUserId = :userId', { userId });

    const rows = await qb.getRawMany<{ pm_mediaId: string }>();
    const ids = rows.map((row) => row.pm_mediaId).filter(Boolean);
    return Array.from(new Set(ids));
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
    // 1. 유효한 커버 후보인지 검증
    const validAssets = await this.getMonthCoverAssetIds(userId, year, month);
    if (!validAssets.includes(coverAssetId)) {
      throw new ForbiddenException(
        '해당 월의 아카이브에 포함된 이미지가 아니거나, 권한이 없습니다.',
      );
    }

    // 2. Upsert
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

    // 1. 해당 월의 PERSONAL 포스트 조회 (내 글만)
    const postsQb = this.postRepo.createQueryBuilder('p');
    postsQb.select(['p.id', 'p.eventAt', 'p.title']);

    postsQb.where('p.ownerUserId = :userId', { userId });
    postsQb.andWhere('p.scope = :scope', { scope: PostScope.PERSONAL });

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
