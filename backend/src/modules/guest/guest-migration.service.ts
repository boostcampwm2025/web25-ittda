import {
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager, QueryFailedError } from 'typeorm';
import { GuestSession } from './guest-session.entity';
import { User } from '../user/entity/user.entity';
import { Post } from '../post/entity/post.entity';
import { PostContributor } from '../post/entity/post-contributor.entity';
import { MediaAsset } from '../media/entity/media-asset.entity';
import { GroupMember } from '../group/entity/group_member.entity';
import { UserMonthCover } from '../user/entity/user-month-cover.entity';
import { Template } from '../template/entity/template.entity';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';

import type { Logger } from 'winston';

@Injectable()
export class GuestMigrationService {
  constructor(
    @InjectRepository(GuestSession)
    private readonly guestSessionRepo: Repository<GuestSession>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  async migrate(guestSessionId: string, targetUserId: string): Promise<void> {
    const session = await this.guestSessionRepo.findOne({
      where: { id: guestSessionId },
    });

    if (!session || !session.userId) {
      throw new NotFoundException('존재하지 않는 게스트 세션입니다.');
    }

    const guestUserId = session.userId;

    if (guestUserId === targetUserId) return; // 이미 로그인된 사용자의 게스트 세션이므로 병합 불필요

    const user = await this.userRepo.findOneBy({ id: guestUserId });
    if (!user) {
      throw new NotFoundException('존재하지 않는 게스트 사용자입니다.');
    }

    try {
      await this.userRepo.manager.transaction(async (em) => {
        await this.migrateProfile(em, guestUserId, targetUserId);

        await em.update(
          Post,
          { ownerUserId: guestUserId },
          { ownerUserId: targetUserId },
        );
        await em.update(
          MediaAsset,
          { ownerUserId: guestUserId },
          { ownerUserId: targetUserId },
        );
        await em.update(
          Template,
          { ownerUserId: guestUserId },
          { ownerUserId: targetUserId },
        );

        await this.migrateGroupMembers(em, guestUserId, targetUserId);
        await this.migratePostContributors(em, guestUserId, targetUserId);
        await this.migrateUserMonthCovers(em, guestUserId, targetUserId);

        await em.delete(GuestSession, { id: guestSessionId });
        await em.delete(User, { id: guestUserId });
      });
    } catch (error) {
      if (error instanceof QueryFailedError) {
        this.logger.error('DB Query Failed', {
          message: error.message,
          stack: error.stack,
        });
        throw new InternalServerErrorException(
          '데이터 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
        );
      }
      this.logger.error('Unexpected error in GuestMigrationService', {
        message: (error as Error).message,
        stack: (error as Error).stack,
      });
      throw new InternalServerErrorException(
        '서버에서 알 수 없는 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
      );
    }
  }

  private async migrateProfile(
    em: EntityManager,
    guestUserId: string,
    targetUserId: string,
  ) {
    const guestUser = await em.findOne(User, { where: { id: guestUserId } });
    const targetUser = await em.findOne(User, { where: { id: targetUserId } });

    if (!guestUser || !targetUser) return;

    const updates: Partial<User> = {};
    if (
      !targetUser.nickname &&
      guestUser.nickname &&
      guestUser.nickname !== '게스트'
    ) {
      updates.nickname = guestUser.nickname;
    }
    if (!targetUser.profileImageId && guestUser.profileImageId) {
      updates.profileImageId = guestUser.profileImageId;
    }

    if (Object.keys(updates).length > 0) {
      await em.update(User, { id: targetUserId }, updates);
    }
  }

  private async migrateGroupMembers(
    em: EntityManager,
    guestUserId: string,
    targetUserId: string,
  ) {
    const guestMembers = await em.find(GroupMember, {
      where: { userId: guestUserId },
    });
    for (const gm of guestMembers) {
      const exists = await em.findOne(GroupMember, {
        where: { groupId: gm.groupId, userId: targetUserId },
      });
      if (exists) {
        // 이미 그룹 멤버라면 게스트 기록 수정 대신 삭제
        await em.delete(GroupMember, { id: gm.id });
      } else {
        await em.update(GroupMember, { id: gm.id }, { userId: targetUserId });
      }
    }
  }

  private async migratePostContributors(
    em: EntityManager,
    guestUserId: string,
    targetUserId: string,
  ) {
    const guestContributors = await em.find(PostContributor, {
      where: { userId: guestUserId },
    });
    for (const pc of guestContributors) {
      const exists = await em.findOne(PostContributor, {
        where: { postId: pc.postId, userId: targetUserId },
      });
      if (exists) {
        await em.delete(PostContributor, {
          postId: pc.postId,
          userId: guestUserId,
        });
      } else {
        await em.update(
          PostContributor,
          { postId: pc.postId, userId: guestUserId },
          { userId: targetUserId },
        );
      }
    }
  }

  private async migrateUserMonthCovers(
    em: EntityManager,
    guestUserId: string,
    targetUserId: string,
  ) {
    const guestCovers = await em.find(UserMonthCover, {
      where: { userId: guestUserId },
    });
    for (const cover of guestCovers) {
      const exists = await em.findOne(UserMonthCover, {
        where: { userId: targetUserId, year: cover.year, month: cover.month },
      });
      if (exists) {
        await em.delete(UserMonthCover, { id: cover.id });
      } else {
        await em.update(
          UserMonthCover,
          { id: cover.id },
          { userId: targetUserId },
        );
      }
    }
  }
}
