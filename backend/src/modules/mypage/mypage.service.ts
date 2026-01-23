import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/entity/user.entity';
import { Post } from '../post/entity/post.entity';
import { PostBlock } from '../post/entity/post-block.entity';
import { TagCount, EmotionCount, UserStats } from './mypage.interface';
import { PostMood } from '@/enums/post-mood.enum';
import { PostBlockType } from '@/enums/post-block-type.enum';
import { BlockValueMap } from '@/modules/post/types/post-block.types';
import { DateTime } from 'luxon';

// Mypage Service에서 기능 구현
@Injectable()
export class MyPageService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Post)
    private readonly postRepo: Repository<Post>,
    @InjectRepository(PostBlock)
    private readonly postBlockRepo: Repository<PostBlock>,
  ) {}

  async findOne(userId: string): Promise<User> {
    return this.userRepo.findOneByOrFail({ id: userId });
  }

  // Record<string, any> 대신 unknown 권장
  async updateSettings(
    userId: string,
    settings: Record<string, unknown>,
  ): Promise<User> {
    const user = await this.findOne(userId);
    user.settings = { ...user.settings, ...settings };
    return this.userRepo.save(user);
  }

  async getTags(
    userId: string,
    sort: 'recent' | 'frequent',
    limit?: number,
  ): Promise<TagCount[]> {
    // frequent: 많이 쓴 순 (count DESC, latest DESC)
    // recent: 최신 순 (latest DESC)
    // 둘 다 GROUP BY tag 필요 (중복 제거 및 count 계산)

    let orderByClause = '';
    if (sort === 'frequent') {
      orderByClause = 'ORDER BY count DESC, max_created_at DESC';
    } else {
      orderByClause = 'ORDER BY max_created_at DESC';
    }

    let querySql = `SELECT unnest(tags) as tag, COUNT(*) as count, MAX(created_at) as max_created_at
         FROM posts 
         WHERE owner_user_id = $1 
         GROUP BY tag 
         ${orderByClause}`;

    const params: any[] = [userId];
    if (limit) {
      querySql += ` LIMIT $2`;
      params.push(limit);
    }

    const query = await this.postRepo.query<
      Array<{ tag: string; count: string; max_created_at: Date }>
    >(querySql, params);

    return query.map((r) => ({
      tag: r.tag,
      count: parseInt(r.count, 10),
    }));
  }

  async getEmotions(
    userId: string,
    sort: 'recent' | 'frequent',
  ): Promise<EmotionCount[]> {
    if (sort === 'frequent') {
      const result = await this.postRepo.query<
        Array<{ emotion: string; count: string }>
      >(
        `SELECT unnest(emotion) as emotion, COUNT(*) as count
         FROM posts 
         WHERE owner_user_id = $1 AND emotion IS NOT NULL
         GROUP BY emotion
         ORDER BY count DESC`,
        [userId],
      );

      return result.map((r) => ({
        emotion: r.emotion,
        count: parseInt(r.count, 10),
      }));
    } else {
      const res = await this.postRepo.find({
        where: { ownerUserId: userId },
        order: { createdAt: 'DESC' },
        select: ['emotion'],
      });

      const validEmotions = res
        .flatMap((r) => r.emotion || [])
        .filter((e): e is PostMood => !!e);
      const counts = new Map<PostMood, number>();
      validEmotions.forEach((emotion) => {
        counts.set(emotion, (counts.get(emotion) ?? 0) + 1);
      });
      return Array.from(counts.entries()).map(([emotion, count]) => ({
        emotion,
        count,
      }));
    }
  }

  async getUserStats(userId: string): Promise<UserStats> {
    const [
      frequentTags,
      recentTags,
      frequentEmotions,
      recentEmotions,
      streak,
      monthlyRecordingDays,
      totalStats,
      locationStats,
    ] = await Promise.all([
      this.getTags(userId, 'frequent', 10),
      this.getTags(userId, 'recent', 10),
      this.getEmotions(userId, 'frequent'),
      this.getEmotions(userId, 'recent'),
      this.getStreak(userId),
      this.getMonthlyRecordingDays(
        userId,
        DateTime.now().year,
        DateTime.now().month,
      ),
      this.getTotalStats(userId),
      this.getLocationStats(userId, 5),
    ]);

    return {
      recentTags: recentTags.map((t) => t.tag),
      frequentTags: frequentTags.map((t) => t.tag),
      recentEmotions: recentEmotions.slice(0, 10).map((e) => e.emotion),
      frequentEmotions: frequentEmotions.slice(0, 10).map((e) => e.emotion),
      streak,
      monthlyRecordingDays,
      totalPosts: totalStats.totalPosts,
      totalImages: totalStats.totalImages,
      frequentLocations: locationStats,
    };
  }

  async getStreak(userId: string): Promise<number> {
    const posts = await this.postRepo
      .createQueryBuilder('post')
      .select('DISTINCT(DATE(post.eventAt))', 'date')
      .where('post.ownerUserId = :userId', { userId })
      .orderBy('date', 'DESC')
      .getRawMany<{ date: string }>();

    if (posts.length === 0) return 0;

    const dates = posts.map((p) =>
      DateTime.fromJSDate(new Date(p.date))
        .setZone('Asia/Seoul')
        .startOf('day'),
    );
    const today = DateTime.now().setZone('Asia/Seoul').startOf('day');
    const yesterday = today.minus({ days: 1 });

    // 마지막 기록이 오늘이나 어제가 아니면 streak은 0
    if (dates[0] < yesterday) return 0;

    let streak = 0;
    let current = dates[0];

    for (const date of dates) {
      if (date.equals(current)) {
        streak++;
        current = current.minus({ days: 1 });
      } else {
        break;
      }
    }

    return streak;
  }

  async getMonthlyRecordingDays(
    userId: string,
    year: number,
    month: number,
  ): Promise<number> {
    const start = DateTime.fromObject({ year, month, day: 1 })
      .setZone('Asia/Seoul')
      .startOf('day')
      .toJSDate();
    const end = DateTime.fromObject({ year, month, day: 1 })
      .setZone('Asia/Seoul')
      .endOf('month')
      .toJSDate();

    const result = await this.postRepo
      .createQueryBuilder('post')
      .select('COUNT(DISTINCT(DATE(post.eventAt)))', 'count')
      .where('post.ownerUserId = :userId', { userId })
      .andWhere('post.eventAt >= :start AND post.eventAt <= :end', {
        start,
        end,
      })
      .getRawOne<{ count: string }>();

    return parseInt(result?.count || '0', 10);
  }

  async getTotalStats(
    userId: string,
  ): Promise<{ totalPosts: number; totalImages: number }> {
    const totalPosts = await this.postRepo.count({
      where: { ownerUserId: userId },
    });

    // 이미지 총 개수: PostBlock 중 type이 IMAGE인 것들의 value 내 mediaIds 개수 합
    const imageBlocks = await this.postBlockRepo
      .createQueryBuilder('block')
      .innerJoin('block.post', 'post')
      .where('post.ownerUserId = :userId', { userId })
      .andWhere('block.type = :type', { type: PostBlockType.IMAGE })
      .select('block.value', 'value')
      .getRawMany<{ value: BlockValueMap[typeof PostBlockType.IMAGE] }>();

    const totalImages = imageBlocks.reduce(
      (acc, curr) => acc + (curr.value?.mediaIds?.length || 0),
      0,
    );

    return { totalPosts, totalImages };
  }

  async getLocationStats(
    userId: string,
    limit: number,
  ): Promise<{ placeName: string; count: number }[]> {
    const locations = await this.postBlockRepo
      .createQueryBuilder('block')
      .innerJoin('block.post', 'post')
      .where('post.ownerUserId = :userId', { userId })
      .andWhere('block.type = :type', { type: PostBlockType.LOCATION })
      .select(
        "COALESCE(block.value->>'placeName', block.value->>'address')",
        'name',
      )
      .addSelect('COUNT(*)', 'count')
      .groupBy('name')
      .orderBy('count', 'DESC')
      .limit(limit)
      .getRawMany<{ name: string; count: string }>();

    return locations
      .filter((loc) => loc.name)
      .map((loc) => ({
        placeName: loc.name,
        count: parseInt(loc.count, 10),
      }));
  }

  /** 내 프로필 수정 (닉네임, 프로필 이미지) */
  async updateProfile(
    userId: string,
    nickname?: string,
    profileImageUrl?: string,
  ): Promise<User> {
    // 1. 닉네임 변경 시 유효성 검사
    if (nickname) {
      if (nickname.length < 2 || nickname.length > 50) {
        throw new BadRequestException(
          '닉네임은 최소 2자 이상, 최대 50자까지 가능합니다.',
        );
      }
      if (!/^[a-zA-Z가-힣0-9]+$/.test(nickname)) {
        throw new BadRequestException(
          '닉네임은 한글, 영어, 숫자만 입력 가능합니다.',
        );
      }
    }

    // 2. 부분 업데이트 수행
    await this.userRepo.update(userId, {
      ...(nickname && { nickname }),
      ...(profileImageUrl && { profileImageUrl }),
    });

    // 3. 수정된 사용자 정보 반환 (no-unsafe-return 방지)
    return this.findOne(userId);
  }

  /** 회원 탈퇴 (Soft Delete) */
  async softDeleteUser(userId: string): Promise<void> {
    // TypeORM의 softDelete는 deletedAt 컬럼에 현재 시간을 기록합니다.
    const result = await this.userRepo.softDelete(userId);

    if (result.affected === 0) {
      throw new BadRequestException(
        '존재하지 않는 사용자이거나 이미 탈퇴 처리되었습니다.',
      );
    }
  }

  /**
   * 월별 감정 요약 조회
   */
  async getEmotionSummary(
    userId: string,
    year: number,
    month: number,
  ): Promise<{ emotion: string; count: number }[]> {
    const fromDate = new Date(year, month - 1, 1);
    // month가 12일 경우 year+1, 0월(1월)로 자동 넘어감
    const toDate = new Date(year, month, 0, 23, 59, 59, 999);

    const result = await this.postRepo.query<
      Array<{ emotion: string; count: string }>
    >(
      `SELECT unnest(emotion) as emotion, COUNT(*) as count
       FROM posts
       WHERE owner_user_id = $1 
         AND event_at >= $2 
         AND event_at <= $3 
         AND emotion IS NOT NULL
       GROUP BY emotion
       ORDER BY count DESC`,
      [userId, fromDate, toDate],
    );

    return result.map((r) => ({
      emotion: r.emotion,
      count: parseInt(r.count, 10),
    }));
  }

  /**
   * 통계 요약 조회 (일간/월간)
   */
  async getStatsSummary(
    userId: string,
    query: { date?: string; month?: string },
  ): Promise<{ count: number }> {
    const qb = this.postRepo.createQueryBuilder('post');
    qb.where('post.owner_user_id = :userId', { userId });

    if (query.date) {
      // YYYY-MM-DD
      const parts = query.date.split('-').map((s) => parseInt(s, 10));
      const start = new Date(parts[0], parts[1] - 1, parts[2]);
      const end = new Date(parts[0], parts[1] - 1, parts[2], 23, 59, 59, 999);

      qb.andWhere('post.event_at >= :start AND post.event_at <= :end', {
        start,
        end,
      });
    } else if (query.month) {
      // YYYY-MM
      const parts = query.month.split('-').map((s) => parseInt(s, 10));
      const start = new Date(parts[0], parts[1] - 1, 1);
      const end = new Date(parts[0], parts[1], 0, 23, 59, 59, 999);

      qb.andWhere('post.event_at >= :start AND post.event_at <= :end', {
        start,
        end,
      });
    } else {
      throw new BadRequestException('Date or Month query required');
    }

    const count = await qb.getCount();
    return { count };
  }
}
