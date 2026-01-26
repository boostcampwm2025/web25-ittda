import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { DateTime } from 'luxon';

import { Post } from '../post/entity/post.entity';
import { PostBlock } from '../post/entity/post-block.entity';
import { TagCount, EmotionCount, UserStats } from './stats.interface';
import { PostMood } from '@/enums/post-mood.enum';
import { PostBlockType } from '@/enums/post-block-type.enum';
import { BlockValueMap } from '@/modules/post/types/post-block.types';

@Injectable()
export class StatsService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepo: Repository<Post>,
    @InjectRepository(PostBlock)
    private readonly postBlockRepo: Repository<PostBlock>,
  ) {}

  async getTags(
    userId: string,
    sort: 'recent' | 'frequent',
    limit?: number,
  ): Promise<TagCount[]> {
    let orderByClause = '';
    if (sort === 'frequent') {
      orderByClause = 'ORDER BY count DESC, max_created_at DESC';
    } else {
      orderByClause = 'ORDER BY max_created_at DESC';
    }

    let querySql = `SELECT unnest(tags) as tag, COUNT(*) as count, MAX(created_at) as max_created_at
         FROM posts 
         WHERE owner_user_id = $1
           AND deleted_at IS NULL
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
      return this.getFrequentEmotions(userId);
    }

    return this.getRecentEmotions(userId);
  }

  private async getFrequentEmotions(userId: string): Promise<EmotionCount[]> {
    const result = await this.postRepo.query<
      Array<{ emotion: string; count: string }>
    >(
      `SELECT emotion, COUNT(*) as count
       FROM (
         SELECT unnest(emotion) as emotion
         FROM posts
         WHERE owner_user_id = $1
           AND emotion IS NOT NULL
           AND deleted_at IS NULL
       ) t
       GROUP BY emotion
       ORDER BY count DESC`,
      [userId],
    );

    const allowed = new Set(Object.values(PostMood));
    const merged = new Map<PostMood, number>();
    result.forEach((row) => {
      const normalized = row.emotion?.trim().normalize('NFC') ?? '';
      if (!allowed.has(normalized as PostMood)) {
        return;
      }
      const count = parseInt(row.count, 10);
      merged.set(
        normalized as PostMood,
        (merged.get(normalized as PostMood) ?? 0) + count,
      );
    });

    return Array.from(merged.entries())
      .map(([emotion, count]) => ({ emotion, count }))
      .sort((a, b) => b.count - a.count);
  }

  private async getRecentEmotions(userId: string): Promise<EmotionCount[]> {
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

  async getEmotionStats(
    userId: string,
    sort: 'recent' | 'frequent',
    limit?: number,
  ): Promise<{ items: EmotionCount[]; totalCount: number }> {
    const items = await this.getEmotions(userId, sort);
    const totalCount = items.reduce((sum, item) => sum + item.count, 0);
    const limited = limit !== undefined ? items.slice(0, limit) : items;
    return { items: limited, totalCount };
  }

  async getUserStats(userId: string): Promise<UserStats> {
    const [
      frequentTags,
      recentTags,
      frequentEmotions,
      recentEmotions,
      totalStats,
      locationStats,
      monthlyCounts,
    ] = await Promise.all([
      this.getTags(userId, 'frequent', 10),
      this.getTags(userId, 'recent', 10),
      this.getEmotions(userId, 'frequent'),
      this.getEmotions(userId, 'recent'),
      this.getTotalStats(userId),
      this.getLocationStats(userId, 5),
      this.getMonthlyCounts(userId, 12),
    ]);

    return {
      recentTags: recentTags.map((t) => t.tag),
      frequentTags: frequentTags.map((t) => t.tag),
      recentEmotions: recentEmotions.slice(0, 10).map((e) => e.emotion),
      frequentEmotions: frequentEmotions.slice(0, 10).map((e) => e.emotion),
      totalPosts: totalStats.totalPosts,
      totalImages: totalStats.totalImages,
      frequentLocations: locationStats,
      monthlyCounts,
    };
  }

  async getStreak(userId: string): Promise<number> {
    const posts = await this.postRepo
      .createQueryBuilder('post')
      .select('DISTINCT(DATE(post.eventAt))', 'date')
      .where('post.ownerUserId = :userId', { userId })
      .andWhere('post.deletedAt IS NULL')
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
      .andWhere('post.deletedAt IS NULL')
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
      where: { ownerUserId: userId, deletedAt: IsNull() },
    });

    const imageBlocks = await this.postBlockRepo
      .createQueryBuilder('block')
      .innerJoin('block.post', 'post')
      .where('post.ownerUserId = :userId', { userId })
      .andWhere('post.deletedAt IS NULL')
      .andWhere('block.type = :type', { type: PostBlockType.IMAGE })
      .select('block.value', 'value')
      .getRawMany<{ value: BlockValueMap[typeof PostBlockType.IMAGE] }>();

    const totalImages = imageBlocks.reduce(
      (acc, curr) => acc + (curr.value?.mediaIds?.length || 0),
      0,
    );

    return { totalPosts, totalImages };
  }

  async getMonthlyCounts(
    userId: string,
    months: number,
  ): Promise<{ month: string; count: number }[]> {
    const now = DateTime.now().setZone('Asia/Seoul').startOf('month');
    const start = now.minus({ months: months - 1 });
    const end = now.plus({ months: 1 });

    const result = await this.postRepo.query<
      Array<{ month: string; count: string }>
    >(
      `SELECT to_char(event_at, 'YYYY-MM') as month, COUNT(*) as count
       FROM posts
       WHERE owner_user_id = $1
         AND event_at >= $2
         AND event_at < $3
         AND deleted_at IS NULL
       GROUP BY month
       ORDER BY month ASC`,
      [userId, start.toJSDate(), end.toJSDate()],
    );

    const counts = new Map(
      result.map((row) => [row.month, parseInt(row.count, 10)]),
    );

    const items: { month: string; count: number }[] = [];
    for (let i = 0; i < months; i += 1) {
      const current = start.plus({ months: i });
      const key = current.toFormat('yyyy-MM');
      items.push({ month: key, count: counts.get(key) ?? 0 });
    }

    return items;
  }

  async getLocationStats(
    userId: string,
    limit: number,
  ): Promise<{ placeName: string; count: number }[]> {
    const locations = await this.postBlockRepo
      .createQueryBuilder('block')
      .innerJoin('block.post', 'post')
      .where('post.ownerUserId = :userId', { userId })
      .andWhere('post.deletedAt IS NULL')
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

  async getEmotionSummary(
    userId: string,
    year: number,
    month: number,
  ): Promise<{ emotion: string; count: number }[]> {
    const fromDate = new Date(year, month - 1, 1);
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
         AND deleted_at IS NULL
       GROUP BY emotion
       ORDER BY count DESC`,
      [userId, fromDate, toDate],
    );

    return result.map((r) => ({
      emotion: r.emotion,
      count: parseInt(r.count, 10),
    }));
  }

  async getStatsSummary(
    userId: string,
    query: { date?: string; month?: string },
  ): Promise<{ count: number }> {
    const qb = this.postRepo.createQueryBuilder('post');
    qb.where('post.owner_user_id = :userId', { userId });
    qb.andWhere('post.deletedAt IS NULL');

    if (query.date) {
      const parts = query.date.split('-').map((s) => parseInt(s, 10));
      const start = new Date(parts[0], parts[1] - 1, parts[2]);
      const end = new Date(parts[0], parts[1] - 1, parts[2], 23, 59, 59, 999);

      qb.andWhere('post.event_at >= :start AND post.event_at <= :end', {
        start,
        end,
      });
    } else if (query.month) {
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
