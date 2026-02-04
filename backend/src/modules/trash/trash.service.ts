import { Injectable, Inject, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, Not, LessThan, In } from 'typeorm';
import { Post } from '../post/entity/post.entity';
import { User } from '../user/entity/user.entity';
//import { GuestSession } from '../guest/guest-session.entity';
import { Cron, CronExpression } from '@nestjs/schedule';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { TrashPostResponseDto } from './dto/trash.dto';
import { DateTime } from 'luxon';

@Injectable()
export class TrashService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepo: Repository<Post>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  /**
   * 휴지통 목록 조회 (내가 삭제한 글들)
   */
  async getTrashPosts(userId: string): Promise<TrashPostResponseDto[]> {
    const posts = await this.postRepo.find({
      where: {
        ownerUserId: userId,
        deletedAt: Not(IsNull()),
      },
      withDeleted: true,
      order: { deletedAt: 'DESC' },
    });

    return posts.map((p) => {
      return {
        id: p.id,
        title: p.title,
        scope: p.scope,
        deletedAt: p.deletedAt!,
        groupId: p.groupId ?? null,
      };
    });
  }

  /**
   * 휴지통 복구
   */
  async restorePost(userId: string, postId: string): Promise<void> {
    const post = await this.postRepo.findOne({
      where: { id: postId, ownerUserId: userId },
      withDeleted: true,
    });

    if (!post || !post.deletedAt) {
      throw new Error('Post not found in trash');
    }

    await this.postRepo.restore(postId);
    this.logger.log('info', `Post restored: ${postId} by user ${userId}`);
  }

  /**
   * 완전 삭제 (수동)
   */
  async hardDeletePost(userId: string, postId: string): Promise<void> {
    const post = await this.postRepo.findOne({
      where: { id: postId, ownerUserId: userId },
      withDeleted: true,
    });

    if (!post) {
      throw new Error('Post not found');
    }

    await this.postRepo.delete(postId); // Hard delete
    this.logger.log(
      'info',
      `Post permanently deleted: ${postId} by user ${userId}`,
    );
  }

  /**
   * [Scheduled] 매일 새벽 3시에 soft delete된 지 30일 이상 지난 기록 영구 삭제
   */
  @Cron('0 3 * * *')
  async handlePermanentDeleteCron() {
    this.logger.log(
      'info',
      'Starting scheduled permanent deletion for soft-deleted posts older than 30 days...',
    );

    const result = await this.postRepo
      .createQueryBuilder()
      .delete()
      .from(Post)
      .where('deletedAt IS NOT NULL') // soft-delete 된 것 중
      .andWhere('deletedAt <= NOW() - INTERVAL 30 DAY') // 30일 이상 지난 것만
      // INTERVAL 30 DAY는 postgresql 전용 데이터 타입 연산자
      .execute();

    this.logger.log(
      'info',
      `Scheduled cleanup finished. Deleted ${result.affected} posts.`,
    );
  }

  /**
   * [Scheduled] 매일 0시에 7일 이상 된 게스트 기록 자동 삭제
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleGuestCleanupCron() {
    this.logger.log('info', 'Starting guest cleanup cron...');

    const oneWeekAgo = DateTime.now().minus({ days: 7 }).toJSDate();

    // 1. 일주일 이상 된 게스트 유저들 찾기
    const guests = await this.userRepo.find({
      where: {
        provider: 'guest',
        createdAt: LessThan(oneWeekAgo),
      },
      select: ['id'],
    });

    if (guests.length === 0) {
      this.logger.log('info', 'No expired guest records found.');
      return;
    }

    const guestIds = guests.map((g) => g.id);

    // 2. 관련 데이터 소프트 삭제 (트랜잭션 권장)
    await this.userRepo.manager.transaction(async (em) => {
      // Post 삭제 (관련 PostBlock, PostContributor, PostMedia는 CASCADE 반영됨)
      //await em.softDelete(Post, { ownerUserId: In(guestIds) });

      // GuestSession 삭제
      //await em.softDelete(GuestSession, { userId: In(guestIds) });

      // 유저 자체 삭제
      await em.softDelete(User, { id: In(guestIds) });
    });

    this.logger.log(
      'info',
      `Guest cleanup finished. Removed ${guests.length} guest accounts and their data.`,
    );
  }
}
