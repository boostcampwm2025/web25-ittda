import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { Post } from '../post/entity/post.entity';
import { TagCount, EmotionCount, UserStats } from './user.interface';

import type { OAuthUserType } from '@/modules/auth/auth.type';
// User Service에서 기능 구현
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Post)
    private readonly postRepo: Repository<Post>,
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
  ): Promise<TagCount[] | string[]> {
    if (sort === 'frequent') {
      // query의 반환값에 타입을 명시하여 unsafe-assignment 방지
      const query = await this.postRepo.query<
        Array<{ tag: string; count: string }>
      >(
        `SELECT unnest(tags) as tag, COUNT(*) as count 
         FROM posts 
         WHERE owner_user_id = $1 
         GROUP BY tag 
         ORDER BY count DESC, MAX(created_at) DESC`,
        [userId],
      ); // PostgreSQL의 unnest() 함수는 배열(Array)을 행(Row)으로 펼쳐주는(평면화하는) 함수
      return query.map((r) => ({
        tag: r.tag,
        count: parseInt(r.count, 10),
      }));
    } else {
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
        .filter((e): e is string => !!e);
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
}
