import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/entity/user.entity';
import { Post } from '../post/entity/post.entity';
import { TagCount, EmotionCount, UserStats } from './mypage.interface';
import { PostMood } from '@/enums/post-mood.enum';

// Mypage Service에서 기능 구현
@Injectable()
export class MyPageService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Post)
    private readonly postRepo: Repository<Post>,
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
  ): Promise<TagCount[] | string[]> {
    if (sort === 'frequent') {
      let querySql = `SELECT unnest(tags) as tag, COUNT(*) as count 
         FROM posts 
         WHERE owner_user_id = $1 
         GROUP BY tag 
         ORDER BY count DESC, MAX(created_at) DESC`;

      const params: any[] = [userId];
      if (limit) {
        querySql += ` LIMIT $2`;
        params.push(limit);
      }

      // query의 반환값에 타입을 명시하여 unsafe-assignment 방지
      const query = await this.postRepo.query<
        Array<{ tag: string; count: string }>
      >(querySql, params); // PostgreSQL의 unnest() 함수는 배열(Array)을 행(Row)으로 펼쳐주는(평면화하는) 함수

      return query.map((r) => ({
        tag: r.tag,
        count: parseInt(r.count, 10),
      }));
    } else {
      // recent: 최신순 (중복 제거된 태그 목록)
      // LIMIT 최적화를 하고 싶지만, 중복 제거 로직(Application Layer) 때문에
      // DB에서 LIMIT을 걸면 중복된 태그만 나올 수 있음.
      // 따라서 충분히 가져와서 메모리에서 필터링하거나,
      // DISTINCT UNNEST 쿼리를 짜야 함.
      // 여기서는 기존 로직 유지하되 결과에서 자름. (limit이 아주 크면 성능 이슈 가능성 있음)

      const query = await this.postRepo.query<Array<{ tag: string }>>(
        `SELECT unnest(tags) as tag, created_at
         FROM posts 
         WHERE owner_user_id = $1 
         ORDER BY created_at DESC`,
        [userId],
      );
      const seen = new Set<string>();
      const result: string[] = [];
      for (const row of query) {
        if (!seen.has(row.tag)) {
          seen.add(row.tag);
          result.push(row.tag);
          if (limit && result.length >= limit) break;
        }
      }
      return result;
    }
  }

  async getEmotions(
    userId: string,
    sort: 'recent' | 'frequent',
  ): Promise<EmotionCount[] | string[]> {
    if (sort === 'frequent') {
      const result = await this.postRepo
        .createQueryBuilder('post')
        .select('post.emotion', 'emotion')
        .addSelect('COUNT(*)', 'count')
        .where('post.ownerUserId = :userId', { userId })
        .andWhere('post.emotion IS NOT NULL')
        .groupBy('post.emotion')
        .orderBy('count', 'DESC')
        .getRawMany<{ emotion: string; count: string }>(); // Raw 결과 타입 지정

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
        .map((r) => r.emotion)
        .filter((e): e is PostMood => !!e);
      return [...new Set(validEmotions)];
    }
  }

  async getUserStats(userId: string): Promise<UserStats> {
    const frequentTagsResult = await this.getTags(userId, 'frequent');
    const recentTagsResult = await this.getTags(userId, 'recent');
    const frequentEmotionsResult = await this.getEmotions(userId, 'frequent');
    const recentEmotionsResult = await this.getEmotions(userId, 'recent');

    // Type Guard를 통해 확실하게 추론 유도
    const frequentTags =
      Array.isArray(frequentTagsResult) &&
      typeof frequentTagsResult[0] === 'object'
        ? (frequentTagsResult as TagCount[])
        : [];
    const recentTags =
      Array.isArray(recentTagsResult) && typeof recentTagsResult[0] === 'string'
        ? (recentTagsResult as string[])
        : [];

    const frequentEmotions =
      Array.isArray(frequentEmotionsResult) &&
      typeof frequentEmotionsResult[0] === 'object'
        ? (frequentEmotionsResult as EmotionCount[])
        : [];
    const recentEmotions =
      Array.isArray(recentEmotionsResult) &&
      typeof recentEmotionsResult[0] === 'string'
        ? (recentEmotionsResult as string[])
        : [];

    return {
      recentTags: recentTags.slice(0, 10),
      frequentTags: frequentTags.slice(0, 10).map((t) => t.tag),
      recentEmotions: recentEmotions.slice(0, 10),
      frequentEmotions: frequentEmotions.slice(0, 10).map((e) => e.emotion),
    };
  }

  /** 내 프로필 수정 (닉네임, 프로필 이미지) */
  async updateProfile(
    userId: string,
    nickname?: string,
    profileImageUrl?: string,
  ): Promise<User> {
    // 1. 닉네임 변경 시 유효성 검사
    if (nickname) {
      if (nickname.length > 8) {
        throw new BadRequestException('닉네임은 최대 8자까지 가능합니다.');
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

    // 2. 쿼리 실행 (group by emotion)
    const qb = this.postRepo.createQueryBuilder('post');
    qb.select('post.emotion', 'emotion');
    qb.addSelect('COUNT(*)', 'count');
    qb.where('post.owner_user_id = :userId', { userId });
    qb.andWhere('post.event_at >= :fromDate AND post.event_at <= :toDate', {
      fromDate,
      toDate,
    });
    qb.andWhere('post.emotion IS NOT NULL');
    qb.groupBy('post.emotion');
    qb.orderBy('count', 'DESC');

    const result = await qb.getRawMany<{ emotion: string; count: string }>();

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
