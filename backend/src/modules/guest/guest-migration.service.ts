import {
  Inject,
  Injectable,
  InternalServerErrorException,
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
    try {
      const session = await this.guestSessionRepo.findOne({
        where: { id: guestSessionId },
      });

      if (!session || !session.userId) {
        return;
      }

      const guestUserId = session.userId;
      if (guestUserId === targetUserId) return;

      await this.userRepo.manager.transaction(async (em) => {
        // 1. 프로필 정보 이관 (대상 유저의 정보가 없는 경우에만)
        await this.migrateProfile(em, guestUserId, targetUserId);

        // 2. 소유권 기반 데이터 이관 (Post, MediaAsset, Template)
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

        // 3. 중복 방지가 필요한 관계 데이터 이관 (GroupMember, PostContributor, UserMonthCover)
        await this.migrateGroupMembers(em, guestUserId, targetUserId);
        await this.migratePostContributors(em, guestUserId, targetUserId);
        await this.migrateUserMonthCovers(em, guestUserId, targetUserId);

        // 4. 게스트 유저 및 세션 삭제
        await em.delete(GuestSession, { id: guestSessionId });
        await em.delete(User, { id: guestUserId });
      });
    } catch (error) {
      if (error instanceof QueryFailedError) {
        // DB 에러 로깅 (상세)
        this.logger.error('DB Query Failed', {
          message: (error as Error).message,
          stack: (error as Error).stack,
        });
        // 사용자 친화적 에러 변환
        throw new InternalServerErrorException(
          '데이터 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
        );
      }
      // 그 외 에러는 그대로 던지되 로깅
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
