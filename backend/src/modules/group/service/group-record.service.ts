import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { DateTime } from 'luxon';

import { Group } from '../entity/group.entity';
import { GroupMonthCover } from '../entity/group-month-cover.entity';
import { Post } from '../../post/entity/post.entity';
import { PostBlock } from '../../post/entity/post-block.entity';
import { PostBlockType } from '@/enums/post-block-type.enum';
import { GroupMonthRecordResponseDto } from '../dto/group-month-record.response.dto';
import { GroupArchiveSortEnum } from '../dto/get-group-monthly-archive.query.dto';
import { GroupDayRecordResponseDto } from '../dto/group-day-record.response.dto';
import {
  PostMedia,
  PostMediaKind,
} from '@/modules/post/entity/post-media.entity';
import {
  GroupCoverCandidatesResponseDto,
  GroupCoverCandidateSectionDto,
  GroupCoverCandidateItemDto,
} from '../dto/group-cover-candidates.response.dto';

@Injectable()
export class GroupRecordService {
  private readonly logger = new Logger(GroupRecordService.name);

  constructor(
    @InjectRepository(Group)
    private readonly groupRepo: Repository<Group>,

    @InjectRepository(GroupMonthCover)
    private readonly groupMonthCoverRepo: Repository<GroupMonthCover>,

    @InjectRepository(Post)
    private readonly postRepo: Repository<Post>,

    @InjectRepository(PostBlock)
    private readonly postBlockRepo: Repository<PostBlock>,

    @InjectRepository(PostMedia)
    private readonly postMediaRepo: Repository<PostMedia>,
  ) {}

  /**
   * 그룹 월별 커버 이미지 변경
   */
  async updateMonthCover(
    groupId: string,
    year: number,
    month: number,
    coverAssetId: string,
    sourcePostId: string,
  ) {
    // 1. 그룹 존재 확인
    const group = await this.groupRepo.findOne({
      where: { id: groupId },
    });

    if (!group) {
      throw new NotFoundException('그룹을 찾을 수 없습니다.');
    }
    this.cleanupStaleGroupMonthCovers(groupId);

    // 2. 게시글 존재 및 그룹 소속 확인
    const post = await this.postRepo.findOne({
      where: { id: sourcePostId, groupId },
    });
    if (!post) {
      throw new NotFoundException('해당 그룹의 게시글을 찾을 수 없습니다.');
    }

    // 추가: 게시글 날짜가 해당 월인지 확인 (보안 강화)
    if (post.eventAt) {
      const postDate = DateTime.fromJSDate(post.eventAt).setZone('Asia/Seoul');
      if (postDate.year !== year || postDate.month !== month) {
        throw new ForbiddenException(
          '게시글의 날짜가 해당 월과 일치하지 않습니다.',
        );
      }
    }

    // 3. Asset 존재 및 게시글 내 포함 여부 확인
    const postMedia = await this.postMediaRepo.findOne({
      where: {
        postId: sourcePostId,
        mediaId: coverAssetId,
        kind: PostMediaKind.BLOCK,
      },
    });
    if (!postMedia) {
      throw new NotFoundException(
        '해당 게시글에 포함된 유효한 이미지가 아닙니다.',
      );
    }

    // 4. Upsert: 기존 커버가 있으면 업데이트, 없으면 생성
    const exist = await this.groupMonthCoverRepo.findOne({
      where: { groupId, year, month },
    });

    if (exist) {
      exist.coverAssetId = coverAssetId;
      exist.sourcePostId = sourcePostId;
      await this.groupMonthCoverRepo.save(exist);
    } else {
      const newCover = this.groupMonthCoverRepo.create({
        groupId,
        year,
        month,
        coverAssetId,
        sourcePostId,
      });
      await this.groupMonthCoverRepo.save(newCover);
    }

    return { coverAssetId, sourcePostId };
  }

  /**
   * 그룹 월별 아카이브 조회
   */
  async getMonthlyArchive(
    groupId: string,
    year: number,
    sort: GroupArchiveSortEnum = GroupArchiveSortEnum.LATEST,
  ): Promise<GroupMonthRecordResponseDto[]> {
    // 1. 그룹 존재 확인
    const group = await this.groupRepo.findOne({
      where: { id: groupId },
    });

    if (!group) {
      throw new NotFoundException('그룹을 찾을 수 없습니다.');
    }

    // 2. 해당 그룹의 모든 게시글 요약 정보 조회
    // (메모리 집계 방식 - 데이터가 아주 많으면 최적화 필요)
    const qb = this.postRepo.createQueryBuilder('p');
    qb.select(['p.id', 'p.eventAt', 'p.title', 'p.groupId'])
      .where('p.groupId = :groupId', { groupId })
      .andWhere('p.deletedAt IS NULL');

    if (year) {
      const start = DateTime.fromObject({ year, month: 1, day: 1 })
        .startOf('year')
        .toJSDate();
      const end = DateTime.fromObject({ year, month: 1, day: 1 })
        .endOf('year')
        .toJSDate();
      qb.andWhere('p.eventAt >= :start AND p.eventAt <= :end', { start, end });
    }

    const posts = await qb.orderBy('p.eventAt', 'DESC').cache(true).getMany();

    if (posts.length === 0) {
      return [];
    }

    // 3. 월별 그룹핑
    const postsByMonth = new Map<string, Post[]>();
    for (const p of posts) {
      if (!p.eventAt) continue;

      let key = 'Unknown';
      // TypeORM raw result or specific driver might return string or Date
      if (typeof p.eventAt === 'string') {
        key = DateTime.fromISO(p.eventAt)
          .setZone('Asia/Seoul')
          .toFormat('yyyy-MM');
      } else if (p.eventAt instanceof Date) {
        key = DateTime.fromJSDate(p.eventAt)
          .setZone('Asia/Seoul')
          .toFormat('yyyy-MM');
      }

      if (key === 'Invalid DateTime') {
        // Fallback or skip
        continue;
      }

      const list = postsByMonth.get(key) ?? [];
      list.push(p);
      postsByMonth.set(key, list);
    }

    const monthKeys = Array.from(postsByMonth.keys());

    // 4. 정렬
    if (sort === GroupArchiveSortEnum.OLDEST) {
      monthKeys.sort((a, b) => a.localeCompare(b));
    } else if (sort === GroupArchiveSortEnum.MOST_RECORDS) {
      monthKeys.sort((a, b) => {
        const countA = postsByMonth.get(a)!.length;
        const countB = postsByMonth.get(b)!.length;
        if (countB !== countA) return countB - countA;
        return b.localeCompare(a); // 같은 개수면 최신순
      });
    } else {
      // LATEST
      monthKeys.sort((a, b) => b.localeCompare(a));
    }

    const slicedKeys = monthKeys;

    if (slicedKeys.length === 0) {
      return [];
    }

    // 6. 필요한 데이터 일괄 조회 (커버, 대표 게시글 블록)
    const customCovers = await this.groupMonthCoverRepo.find({
      where: { groupId },
    });
    const coverMap = new Map<
      string,
      { assetId: string | null; sourcePostId: string | null }
    >();
    for (const c of customCovers) {
      const key = `${c.year}-${c.month.toString().padStart(2, '0')}`;
      coverMap.set(key, {
        assetId: c.coverAssetId,
        sourcePostId: c.sourcePostId,
      });
    }

    const representativePostIds = slicedKeys.map(
      (k) => postsByMonth.get(k)![0].id,
    );

    const imageBlocks = await this.postBlockRepo.find({
      where: {
        postId: In(posts.map((p) => p.id)),
        type: PostBlockType.IMAGE,
      },
      order: {
        postId: 'ASC',
        layoutRow: 'ASC',
        layoutCol: 'ASC',
        layoutSpan: 'ASC',
      },
    });

    const imageBlocksByPostId = new Map<string, PostBlock[]>();
    for (const b of imageBlocks) {
      const list = imageBlocksByPostId.get(b.postId) ?? [];
      list.push(b);
      imageBlocksByPostId.set(b.postId, list);
    }

    const locationBlocks = await this.postBlockRepo.find({
      where: {
        postId: In(representativePostIds),
        type: PostBlockType.LOCATION,
      },
      order: {
        postId: 'ASC',
        layoutRow: 'ASC',
        layoutCol: 'ASC',
        layoutSpan: 'ASC',
      },
    });

    const locationBlocksByPostId = new Map<string, PostBlock[]>();
    for (const b of locationBlocks) {
      const list = locationBlocksByPostId.get(b.postId) ?? [];
      list.push(b);
      locationBlocksByPostId.set(b.postId, list);
    }

    // 7. 결과 구성
    const items: GroupMonthRecordResponseDto[] = [];
    for (const mKey of slicedKeys) {
      const monthPosts = postsByMonth.get(mKey)!;
      const latestPost = monthPosts[0];

      let coverAssetId: string | null = null;
      let sourcePostId: string | null = null;

      const custom = coverMap.get(mKey);
      if (custom && (custom.assetId || custom.sourcePostId)) {
        coverAssetId = custom.assetId;
        sourcePostId = custom.sourcePostId;
      } else {
        const latestImage = this.findLatestImageFromPosts(
          monthPosts,
          imageBlocksByPostId,
        );
        if (latestImage) {
          coverAssetId = latestImage.assetId;
          sourcePostId = latestImage.sourcePostId;
        }
      }

      let placeName: string | null = null;
      const locBlock = locationBlocksByPostId.get(latestPost.id)?.[0] ?? null;
      if (locBlock && locBlock.value) {
        const val = locBlock.value as { placeName?: string; address?: string };
        placeName = val.placeName || val.address || null;
      }

      items.push({
        month: mKey,
        coverAssetId,
        sourcePostId,
        count: monthPosts.length,
        latestTitle: latestPost.title,
        latestLocation: placeName,
      });
    }

    return items;
  }

  /**
   * 그룹 일별 아카이브 조회
   */
  async getDailyArchive(
    groupId: string,
    year: number,
    month: number,
  ): Promise<GroupDayRecordResponseDto[]> {
    // 1. 그룹 존재 확인
    const group = await this.groupRepo.findOne({
      where: { id: groupId },
    });

    if (!group) {
      throw new NotFoundException('그룹을 찾을 수 없습니다.');
    }

    // 2. 조회 기간 설정 (해당 월의 시작~끝)
    const start = DateTime.fromObject({ year, month, day: 1 }).startOf('month');
    const end = start.endOf('month');

    const fromDate = start.toJSDate();
    const toDate = end.toJSDate();

    // 3. 해당 그룹의 포스트 조회
    const posts = await this.postRepo.find({
      where: {
        groupId,
      },
      select: ['id', 'eventAt', 'title'],
      order: { eventAt: 'DESC' },
    });

    // eventAt이 해당 월 범위 내에 있는 것만 필터링
    const filteredPosts = posts.filter(
      (p) => p.eventAt && p.eventAt >= fromDate && p.eventAt <= toDate,
    );

    if (filteredPosts.length === 0) {
      return [];
    }

    // 4. 일별 그룹핑 (YYYY-MM-DD)
    const postsByDay = new Map<string, Post[]>();

    for (const p of filteredPosts) {
      if (!p.eventAt) continue;
      const dt = DateTime.fromJSDate(p.eventAt).setZone('Asia/Seoul');
      const dayKey = dt.toFormat('yyyy-MM-dd');

      const list = postsByDay.get(dayKey) ?? [];
      list.push(p);
      postsByDay.set(dayKey, list);
    }

    // 5. 각 일별 대표 포스트(최신) 추출
    const dayKeys = Array.from(postsByDay.keys()).sort(); // 날짜 오름차순
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
      const latestPost = dayPosts[0]; // 이미 DESC 정렬됨

      resultFromDay.set(dKey, {
        postCount: dayPosts.length,
        latestPost,
      });

      representativePostIds.push(latestPost.id);
    }

    const imageBlocks = await this.postBlockRepo.find({
      where: {
        postId: In(filteredPosts.map((p) => p.id)),
        type: PostBlockType.IMAGE,
      },
      order: {
        postId: 'ASC',
        layoutRow: 'ASC',
        layoutCol: 'ASC',
        layoutSpan: 'ASC',
      },
    });

    const imageBlocksByPostId = new Map<string, PostBlock[]>();
    for (const b of imageBlocks) {
      const list = imageBlocksByPostId.get(b.postId) ?? [];
      list.push(b);
      imageBlocksByPostId.set(b.postId, list);
    }

    const locationBlocks = await this.postBlockRepo.find({
      where: {
        postId: In(representativePostIds),
        type: PostBlockType.LOCATION,
      },
      order: {
        postId: 'ASC',
        layoutRow: 'ASC',
        layoutCol: 'ASC',
        layoutSpan: 'ASC',
      },
    });

    const locationBlocksByPostId = new Map<string, PostBlock[]>();
    for (const b of locationBlocks) {
      const list = locationBlocksByPostId.get(b.postId) ?? [];
      list.push(b);
      locationBlocksByPostId.set(b.postId, list);
    }

    // 7. DTO 조립
    const results: GroupDayRecordResponseDto[] = [];
    for (const dKey of dayKeys) {
      const { postCount, latestPost } = resultFromDay.get(dKey)!;

      // 커버 이미지 찾기
      let coverThumbnailId: string | null = null;
      const latestImage = this.findLatestImageFromPosts(
        postsByDay.get(dKey)!,
        imageBlocksByPostId,
      );
      if (latestImage) {
        coverThumbnailId = latestImage.assetId;
      }

      // 장소명 찾기
      let placeName: string | null = null;
      const locBlock = locationBlocksByPostId.get(latestPost.id)?.[0] ?? null;
      if (locBlock && locBlock.value) {
        const val = locBlock.value as { placeName?: string; address?: string };
        placeName = val.placeName || val.address || null;
      }

      results.push({
        date: dKey,
        postCount,
        coverAssetId: coverThumbnailId,
        latestPostTitle: latestPost.title,
        latestPlaceName: placeName,
      });
    }

    // 날짜 오름차순 정렬되어 있음
    return results;
  }

  /**
   * 그룹 월별 이미지 조회 (커버 선택용)
   */
  async getMonthImages(
    groupId: string,
    year: number,
    month: number,
    cursor?: string,
    limit: number = 20,
  ): Promise<GroupCoverCandidatesResponseDto> {
    return this.getCoverCandidatesByMonth(groupId, year, month, cursor, limit);
  }

  /**
   * 그룹 커버 후보 조회 (Refactored)
   */
  async getCoverCandidates(
    groupId: string,
    cursor?: string,
    limit: number = 20,
  ): Promise<GroupCoverCandidatesResponseDto> {
    return this.getCoverCandidatesAll(groupId, cursor, limit);
  }

  private async getCoverCandidatesByMonth(
    groupId: string,
    year: number,
    month: number,
    cursor?: string,
    limit: number = 20,
  ): Promise<GroupCoverCandidatesResponseDto> {
    // 1. 그룹 존재 확인
    const group = await this.groupRepo.findOne({ where: { id: groupId } });
    if (!group) {
      throw new NotFoundException('그룹을 찾을 수 없습니다.');
    }

    // 2. 조회 기간 설정
    const from = DateTime.fromObject({ year, month, day: 1 })
      .setZone('Asia/Seoul')
      .startOf('month');
    const to = from.endOf('month');

    // 3. PostMedia 조회 (IMAGE 블록에 속한 미디어들)
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

    qb.where('p.groupId = :groupId', { groupId });
    qb.andWhere('pm.kind = :kind', { kind: PostMediaKind.BLOCK });
    qb.andWhere('p.eventAt >= :fromDate AND p.eventAt <= :toDate', {
      fromDate: from.toJSDate(),
      toDate: to.toJSDate(),
    });
    qb.andWhere('p.deletedAt IS NULL');
    qb.andWhere('ma.deletedAt IS NULL');

    // Cursor Pagination
    if (cursor) {
      try {
        const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
        const [eventAtStr, id] = decoded.split('__');
        if (eventAtStr && id) {
          qb.andWhere(
            '(p.eventAt < :cursorEventAt OR (p.eventAt = :cursorEventAt AND pm.id < :cursorId))',
            {
              cursorEventAt: new Date(eventAtStr),
              cursorId: id,
            },
          );
        }
      } catch {
        // invalid cursor ignore
      }
    }

    qb.orderBy('p.eventAt', 'DESC');
    qb.addOrderBy('pm.id', 'DESC');
    qb.take(limit + 1);

    const pmList = await qb.getMany();

    const hasNext = pmList.length > limit;
    const currentBatch = pmList.slice(0, limit);

    // 4. 그룹화 (Date별)
    const sectionsMap = new Map<string, GroupCoverCandidateItemDto[]>();

    for (const pm of currentBatch) {
      const dateStr = pm.post.eventAt
        ? DateTime.fromJSDate(pm.post.eventAt)
            .setZone('Asia/Seoul')
            .toFormat('yyyy-MM-dd')
        : 'Unknown';

      const item: GroupCoverCandidateItemDto = {
        mediaId: pm.mediaId,
        postId: pm.post.id,
        postTitle: pm.post.title,
        eventAt: pm.post.eventAt!,
        width: pm.media?.width,
        height: pm.media?.height,
        mimeType: pm.media?.mimeType,
      };

      if (!sectionsMap.has(dateStr)) {
        sectionsMap.set(dateStr, []);
      }
      sectionsMap.get(dateStr)!.push(item);
    }

    const sections: GroupCoverCandidateSectionDto[] = Array.from(
      sectionsMap.entries(),
    ).map(([date, items]) => ({
      date,
      items,
    }));

    // 5. Next Cursor 생성
    let nextCursor: string | null = null;
    if (hasNext) {
      const lastItem = currentBatch[currentBatch.length - 1];
      const lastEventAt = lastItem.post?.eventAt;
      if (lastEventAt) {
        const payload = `${lastEventAt.toISOString()}__${lastItem.id}`;
        nextCursor = Buffer.from(payload).toString('base64');
      }
    }

    return {
      groupId,
      sections,
      pageInfo: {
        hasNext,
        nextCursor,
      },
    };
  }

  private async getCoverCandidatesAll(
    groupId: string,
    cursor?: string,
    limit: number = 20,
  ): Promise<GroupCoverCandidatesResponseDto> {
    // 1. 그룹 존재 확인
    const group = await this.groupRepo.findOne({ where: { id: groupId } });
    if (!group) {
      throw new NotFoundException('그룹을 찾을 수 없습니다.');
    }

    // 2. PostMedia 조회 (IMAGE 블록에 속한 미디어들)
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

    qb.where('p.groupId = :groupId', { groupId });
    qb.andWhere('pm.kind = :kind', { kind: PostMediaKind.BLOCK });
    qb.andWhere('p.deletedAt IS NULL');
    qb.andWhere('ma.deletedAt IS NULL');

    // Cursor Pagination
    if (cursor) {
      try {
        const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
        const [eventAtStr, id] = decoded.split('__');
        if (eventAtStr && id) {
          qb.andWhere(
            '(p.eventAt < :cursorEventAt OR (p.eventAt = :cursorEventAt AND pm.id < :cursorId))',
            {
              cursorEventAt: new Date(eventAtStr),
              cursorId: id,
            },
          );
        }
      } catch {
        // invalid cursor ignore
      }
    }

    qb.orderBy('p.eventAt', 'DESC');
    qb.addOrderBy('pm.id', 'DESC');
    qb.take(limit + 1);

    const pmList = await qb.getMany();

    const hasNext = pmList.length > limit;
    const currentBatch = pmList.slice(0, limit);

    const sectionsMap = new Map<string, GroupCoverCandidateItemDto[]>();
    for (const pm of currentBatch) {
      const dateStr = pm.post.eventAt
        ? DateTime.fromJSDate(pm.post.eventAt)
            .setZone('Asia/Seoul')
            .toFormat('yyyy-MM-dd')
        : 'Unknown';

      const item: GroupCoverCandidateItemDto = {
        mediaId: pm.mediaId,
        postId: pm.post.id,
        postTitle: pm.post.title,
        eventAt: pm.post.eventAt!,
        width: pm.media?.width,
        height: pm.media?.height,
        mimeType: pm.media?.mimeType,
      };

      if (!sectionsMap.has(dateStr)) {
        sectionsMap.set(dateStr, []);
      }
      sectionsMap.get(dateStr)!.push(item);
    }

    const sections: GroupCoverCandidateSectionDto[] = Array.from(
      sectionsMap.entries(),
    ).map(([date, items]) => ({
      date,
      items,
    }));

    // Next Cursor 생성
    let nextCursor: string | null = null;
    if (hasNext) {
      const lastItem = currentBatch[currentBatch.length - 1];
      const lastEventAt = lastItem.post?.eventAt;
      if (lastEventAt) {
        const payload = `${lastEventAt.toISOString()}__${lastItem.id}`;
        nextCursor = Buffer.from(payload).toString('base64');
      }
    }

    return {
      groupId,
      sections,
      pageInfo: {
        hasNext,
        nextCursor,
      },
    };
  }

  /**
   * 그룹의 해당 월 중 기록이 있는 날짜 조회
   */
  async getRecordedDays(
    groupId: string,
    year: number,
    month: number,
  ): Promise<string[]> {
    // 1. 그룹 존재 확인
    const group = await this.groupRepo.findOne({
      where: { id: groupId },
    });

    if (!group) {
      throw new NotFoundException('그룹을 찾을 수 없습니다.');
    }

    // 2. 조회 기간 설정
    const start = DateTime.fromObject({ year, month, day: 1 }).startOf('month');
    const end = start.endOf('month');
    const fromDate = start.toJSDate();
    const toDate = end.toJSDate();

    // 3. 해당 월의 포스트 조회
    const posts = await this.postRepo.find({
      where: {
        groupId,
      },
      select: ['eventAt'],
      order: { eventAt: 'DESC' },
    });

    // eventAt이 해당 월 범위 내에 있는 것만 필터링
    const filteredPosts = posts.filter(
      (p) => p.eventAt && p.eventAt >= fromDate && p.eventAt <= toDate,
    );

    // 4. 날짜 추출 및 중복 제거
    const dateSet = new Set<string>();
    for (const p of filteredPosts) {
      if (!p.eventAt) continue;
      // KST 기준 날짜 추출
      const dt = DateTime.fromJSDate(p.eventAt).setZone('Asia/Seoul');
      dateSet.add(dt.toFormat('yyyy-MM-dd'));
    }

    // 최신순 정렬
    return Array.from(dateSet).sort().reverse();
  }

  private findLatestImageFromPosts(
    posts: Post[],
    imageBlocksByPostId: Map<string, PostBlock[]>,
  ): { assetId: string; sourcePostId: string } | null {
    for (const post of posts) {
      const blocks = imageBlocksByPostId.get(post.id);
      if (!blocks) continue;
      for (const block of blocks) {
        const val = block.value as { mediaIds?: string[] };
        if (val.mediaIds && val.mediaIds.length > 0) {
          return { assetId: val.mediaIds[0], sourcePostId: post.id };
        }
      }
    }
    return null;
  }

  private cleanupStaleGroupMonthCovers(groupId: string) {
    void this.groupMonthCoverRepo
      .createQueryBuilder()
      .update()
      .set({ coverAssetId: null, sourcePostId: null })
      .where('groupId = :groupId', { groupId })
      .andWhere(
        '("cover_media_asset_id" IN (SELECT id FROM media_assets WHERE deleted_at IS NOT NULL) OR "source_post_id" IN (SELECT id FROM posts WHERE deleted_at IS NOT NULL))',
      )
      .execute()
      .catch((error) => {
        const message =
          error instanceof Error ? error.message : 'unknown error';
        this.logger.warn(
          `Failed to cleanup group month covers (groupId=${groupId}): ${message}`,
        );
      });
  }
}
