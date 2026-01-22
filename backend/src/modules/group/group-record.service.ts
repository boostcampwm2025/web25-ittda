import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { DateTime } from 'luxon';

import { Group } from './entity/group.entity';
import { GroupMonthCover } from './entity/group-month-cover.entity';
import { Post } from '../post/entity/post.entity';
import { PostBlock } from '../post/entity/post-block.entity';
import { PostBlockType } from '@/enums/post-block-type.enum';
import { GroupMonthRecordResponseDto } from './dto/group-month-record.response.dto';
import { GroupArchiveSortEnum } from './dto/get-group-monthly-archive.query.dto';
import { GroupDayRecordResponseDto } from './dto/group-day-record.response.dto';

@Injectable()
export class GroupRecordService {
  constructor(
    @InjectRepository(Group)
    private readonly groupRepo: Repository<Group>,

    @InjectRepository(GroupMonthCover)
    private readonly groupMonthCoverRepo: Repository<GroupMonthCover>,

    @InjectRepository(Post)
    private readonly postRepo: Repository<Post>,

    @InjectRepository(PostBlock)
    private readonly postBlockRepo: Repository<PostBlock>,
  ) {}

  /**
   * 그룹 월별 커버 이미지 변경
   */
  async updateMonthCover(
    groupId: string,
    year: number,
    month: number,
    coverAssetId: string,
  ) {
    // 그룹 존재 확인
    const group = await this.groupRepo.findOne({
      where: { id: groupId },
    });

    if (!group) {
      throw new NotFoundException('그룹을 찾을 수 없습니다.');
    }

    // Upsert: 기존 커버가 있으면 업데이트, 없으면 생성
    const exist = await this.groupMonthCoverRepo.findOne({
      where: { groupId, year, month },
    });

    if (exist) {
      exist.coverAssetId = coverAssetId;
      await this.groupMonthCoverRepo.save(exist);
    } else {
      const newCover = this.groupMonthCoverRepo.create({
        groupId,
        year,
        month,
        coverAssetId,
      });
      await this.groupMonthCoverRepo.save(newCover);
    }

    return { coverAssetId };
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

    // 2. 조회 기간 설정 (YYYY-01-01 ~ YYYY-12-31)
    const startDate = DateTime.fromObject({ year, month: 1, day: 1 }).startOf(
      'year',
    );
    const endDate = startDate.endOf('year');

    const from = startDate.toJSDate();
    const to = endDate.toJSDate();

    // 3. 해당 그룹의 포스트 조회
    const posts = await this.postRepo.find({
      where: {
        groupId,
      },
      select: ['id', 'eventAt', 'title'],
      order: { eventAt: 'DESC' },
    });

    // eventAt이 해당 연도 범위 내에 있는 것만 필터링
    const filteredPosts = posts.filter(
      (p) => p.eventAt && p.eventAt >= from && p.eventAt <= to,
    );

    if (filteredPosts.length === 0) {
      return [];
    }

    // 4. 월별 그룹핑 (YYYY-MM)
    const postsByMonth = new Map<string, Post[]>();

    for (const p of filteredPosts) {
      if (!p.eventAt) continue;
      const dt = DateTime.fromJSDate(p.eventAt).setZone('Asia/Seoul');
      const monthKey = dt.toFormat('yyyy-MM');

      const list = postsByMonth.get(monthKey) ?? [];
      list.push(p);
      postsByMonth.set(monthKey, list);
    }

    // 5. 커버 이미지 매핑 조회
    const customCovers = await this.groupMonthCoverRepo.find({
      where: { groupId, year },
    });
    const customCoverMap = new Map<string, string>();
    for (const c of customCovers) {
      const key = `${c.year}-${c.month.toString().padStart(2, '0')}`;
      customCoverMap.set(key, c.coverAssetId ?? '');
    }

    // 6. 각 월별 대표 포스트 ID 추출
    const monthKeys = Array.from(postsByMonth.keys()).sort().reverse();
    const representativePostIds: string[] = [];

    const resultFromMonth = new Map<
      string,
      {
        postCount: number;
        latestPost: Post;
      }
    >();

    for (const mKey of monthKeys) {
      const monthPosts = postsByMonth.get(mKey)!;
      const latestPost = monthPosts[0]; // 이미 DESC 정렬됨

      resultFromMonth.set(mKey, {
        postCount: monthPosts.length,
        latestPost,
      });

      representativePostIds.push(latestPost.id);
    }

    // 7. 대표 포스트들의 블록 조회 (IMAGE, LOCATION)
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

    // 8. DTO 조립
    const results: GroupMonthRecordResponseDto[] = [];
    for (const mKey of monthKeys) {
      const { postCount, latestPost } = resultFromMonth.get(mKey)!;
      const relatedBlocks = blocksByPostId.get(latestPost.id) ?? [];

      // 커버 이미지 찾기
      let coverAssetId: string | null = null;
      const customId = customCoverMap.get(mKey);
      if (customId) {
        coverAssetId = customId;
      } else {
        // 최신 포스트의 첫 번째 이미지 사용
        const imgBlock = relatedBlocks.find(
          (b) => b.type === PostBlockType.IMAGE,
        );
        if (imgBlock && imgBlock.value) {
          const val = imgBlock.value as { mediaIds?: string[] };
          if (val.mediaIds && val.mediaIds.length > 0) {
            coverAssetId = val.mediaIds[0];
          }
        }
      }

      // 장소명 찾기
      let placeName: string | null = null;
      const locBlock = relatedBlocks.find(
        (b) => b.type === PostBlockType.LOCATION,
      );
      if (locBlock && locBlock.value) {
        const val = locBlock.value as { placeName?: string; address?: string };
        placeName = val.placeName || val.address || null;
      }

      results.push({
        month: mKey,
        coverAssetId,
        count: postCount,
        latestTitle: latestPost.title,
        latestLocation: placeName,
      });
    }

    // 9. 정렬 적용
    if (sort === GroupArchiveSortEnum.OLDEST) {
      results.sort((a, b) => a.month.localeCompare(b.month));
    } else if (sort === GroupArchiveSortEnum.MOST_RECORDS) {
      results.sort((a, b) => {
        if (b.count !== a.count) {
          return b.count - a.count;
        }
        return b.month.localeCompare(a.month);
      });
    }
    // LATEST는 이미 기본값 (DESC)

    return results;
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

    // 6. 대표 포스트들의 블록 조회 (IMAGE, LOCATION)
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

    // 7. DTO 조립
    const results: GroupDayRecordResponseDto[] = [];
    for (const dKey of dayKeys) {
      const { postCount, latestPost } = resultFromDay.get(dKey)!;
      const relatedBlocks = blocksByPostId.get(latestPost.id) ?? [];

      // 커버 이미지 찾기
      let coverThumbnailId: string | null = null;
      const imgBlock = relatedBlocks.find(
        (b) => b.type === PostBlockType.IMAGE,
      );
      if (imgBlock && imgBlock.value) {
        const val = imgBlock.value as { mediaIds?: string[] };
        if (val.mediaIds && val.mediaIds.length > 0) {
          coverThumbnailId = val.mediaIds[0];
        }
      }

      // 장소명 찾기
      let placeName: string | null = null;
      const locBlock = relatedBlocks.find(
        (b) => b.type === PostBlockType.LOCATION,
      );
      if (locBlock && locBlock.value) {
        const val = locBlock.value as { placeName?: string; address?: string };
        placeName = val.placeName || val.address || null;
      }

      results.push({
        date: dKey,
        postCount,
        coverThumbnailId,
        latestPostTitle: latestPost.title,
        latestPlaceName: placeName,
      });
    }

    // 날짜 오름차순 정렬되어 있음
    return results;
  }
}
