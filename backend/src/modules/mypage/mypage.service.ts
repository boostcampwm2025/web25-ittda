import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { User } from '../user/entity/user.entity';
import { RefreshToken } from '../auth/refresh_token/refresh_token.entity';
import { Post } from '../post/entity/post.entity';
import { PostScope } from '@/enums/post-scope.enum';
import { TemplateScope } from '@/enums/template-scope.enum';
import { MediaAssetDeletionPlan, MediaService } from '../media/media.service';
import { GroupMember } from '../group/entity/group_member.entity';
import { GroupRoleEnum } from '@/enums/group-role.enum';
import { pickNextGroupAdmin } from '../group/utils/group-role-priority';
import { GroupService } from '../group/service/group.service';
import { Template } from '../template/entity/template.entity';
import { UserMonthCover } from '../user/entity/user-month-cover.entity';
import {
  DraftInvalidationResult,
  PostDraftCleanupService,
} from '../post/post-draft-cleanup.service';

type WithdrawalMembershipCleanupResult = {
  draftInvalidation: DraftInvalidationResult | null;
  mediaDeletionPlans: MediaAssetDeletionPlan[];
};

// Mypage Service에서 기능 구현
@Injectable()
export class MyPageService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly groupService: GroupService,
    private readonly mediaService: MediaService,
    private readonly postDraftCleanupService: PostDraftCleanupService,
  ) {}

  async findOne(userId: string): Promise<User> {
    const user = await this.userRepo.findOneBy({ id: userId });
    if (!user) {
      throw new UnauthorizedException('사용자를 찾을 수 없습니다.');
    }
    return user;
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

  /** 내 프로필 수정 (닉네임, 프로필 이미지) */
  async updateProfile(
    userId: string,
    nickname?: string,
    profileImageId?: string,
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
    const updateData: Partial<User> = {
      ...(nickname && { nickname }),
      ...(profileImageId && { profileImageId }),
    };

    if (Object.keys(updateData).length > 0) {
      await this.userRepo.update(userId, updateData);
    }

    // 3. 수정된 사용자 정보 반환 (no-unsafe-return 방지)
    return this.findOne(userId);
  }

  private async handleWithdrawalMembership(
    manager: EntityManager,
    groupMemberRepo: Repository<GroupMember>,
    membership: GroupMember,
  ): Promise<WithdrawalMembershipCleanupResult> {
    if (membership.role !== GroupRoleEnum.ADMIN) {
      const draftInvalidation =
        await this.postDraftCleanupService.invalidateOwnedDraftsInGroupWithManager(
          manager,
          membership.userId,
          membership.groupId,
          'OWNER_WITHDRAWN',
        );
      await groupMemberRepo.softDelete(membership.id);
      const mediaDeletionPlans =
        membership.profileMediaId != null
          ? await this.mediaService.deleteOrphanMediaCandidatesWithManager(
              manager,
              [membership.profileMediaId],
            )
          : [];
      return {
        draftInvalidation,
        mediaDeletionPlans: [
          ...draftInvalidation.mediaDeletionPlans,
          ...mediaDeletionPlans,
        ],
      };
    }

    const groupMembers = await groupMemberRepo
      .createQueryBuilder('gm')
      .where('gm.groupId = :groupId', { groupId: membership.groupId })
      .orderBy('gm.joinedAt', 'ASC')
      .setLock('pessimistic_write', undefined, ['gm'])
      .getMany();

    const me = groupMembers.find(
      (groupMember) => groupMember.id === membership.id,
    );

    if (!me) {
      throw new BadRequestException('그룹 멤버가 아닙니다.');
    }

    const remainingMembers = groupMembers.filter(
      (groupMember) => groupMember.id !== me.id,
    );

    const remainingAdmins = remainingMembers.filter(
      (groupMember) => groupMember.role === GroupRoleEnum.ADMIN,
    );

    if (remainingAdmins.length > 0) {
      const draftInvalidation =
        await this.postDraftCleanupService.invalidateOwnedDraftsInGroupWithManager(
          manager,
          membership.userId,
          membership.groupId,
          'OWNER_WITHDRAWN',
        );
      await groupMemberRepo.softDelete(me.id);
      const mediaDeletionPlans =
        membership.profileMediaId != null
          ? await this.mediaService.deleteOrphanMediaCandidatesWithManager(
              manager,
              [membership.profileMediaId],
            )
          : [];
      return {
        draftInvalidation,
        mediaDeletionPlans: [
          ...draftInvalidation.mediaDeletionPlans,
          ...mediaDeletionPlans,
        ],
      };
    }

    if (remainingMembers.length === 0) {
      const draftInvalidation = await this.groupService.deleteGroupWithManager(
        manager,
        membership.groupId,
      );
      return {
        draftInvalidation,
        mediaDeletionPlans: draftInvalidation.mediaDeletionPlans,
      };
    }

    const nextAdmin = pickNextGroupAdmin(remainingMembers);

    if (!nextAdmin) {
      throw new BadRequestException(
        '관리자 권한을 양도할 그룹 멤버를 찾을 수 없습니다.',
      );
    }

    nextAdmin.role = GroupRoleEnum.ADMIN;
    await groupMemberRepo.save(nextAdmin);
    const draftInvalidation =
      await this.postDraftCleanupService.invalidateOwnedDraftsInGroupWithManager(
        manager,
        membership.userId,
        membership.groupId,
        'OWNER_WITHDRAWN',
      );
    await groupMemberRepo.softDelete(me.id);
    const mediaDeletionPlans =
      membership.profileMediaId != null
        ? await this.mediaService.deleteOrphanMediaCandidatesWithManager(
            manager,
            [membership.profileMediaId],
          )
        : [];
    return {
      draftInvalidation,
      mediaDeletionPlans: [
        ...draftInvalidation.mediaDeletionPlans,
        ...mediaDeletionPlans,
      ],
    };
  }

  /**
   * 회원 탈퇴
   * @param userId 탈퇴 대상 사용자 ID
   */
  async withdraw(userId: string): Promise<void> {
    const draftInvalidations: DraftInvalidationResult[] = [];
    const mediaDeletionPlans: MediaAssetDeletionPlan[] = [];

    await this.userRepo.manager.transaction(async (manager) => {
      const groupMemberRepo = manager.getRepository(GroupMember);
      const postRepo = manager.getRepository(Post);
      const templateRepo = manager.getRepository(Template);
      const userMonthCoverRepo = manager.getRepository(UserMonthCover);
      const refreshTokenRepo = manager.getRepository(RefreshToken);
      const userRepo = manager.getRepository(User);

      const user = await userRepo
        .createQueryBuilder('u')
        .where('u.id = :userId', { userId })
        .setLock('pessimistic_write')
        .getOne();

      if (!user) {
        throw new BadRequestException(
          '존재하지 않는 사용자이거나 이미 탈퇴 처리되었습니다.',
        );
      }

      const personalPosts = await postRepo.find({
        where: { ownerUserId: userId, scope: PostScope.PERSONAL },
        select: { id: true },
      });
      const personalPostIds = personalPosts.map((post) => post.id);
      const [personalPostMediaIds, userMonthCoverMediaIds] = await Promise.all([
        this.mediaService.collectPostMediaIdsWithManager(
          manager,
          personalPostIds,
        ),
        this.mediaService.collectUserMonthCoverMediaIdsWithManager(
          manager,
          userId,
        ),
      ]);

      const memberships = await groupMemberRepo
        .createQueryBuilder('gm')
        .where('gm.userId = :userId', { userId })
        .orderBy('gm.groupId', 'ASC')
        .setLock('pessimistic_write', undefined, ['gm'])
        .getMany();

      for (const membership of memberships) {
        const membershipCleanup = await this.handleWithdrawalMembership(
          manager,
          groupMemberRepo,
          membership,
        );
        if (membershipCleanup.draftInvalidation) {
          draftInvalidations.push(membershipCleanup.draftInvalidation);
        }
        mediaDeletionPlans.push(...membershipCleanup.mediaDeletionPlans);
      }

      await postRepo.update({ ownerUserId: userId }, { shareToken: null });
      await postRepo.softDelete({
        ownerUserId: userId,
        scope: PostScope.PERSONAL,
      });
      await templateRepo.softDelete({
        ownerUserId: userId,
        scope: TemplateScope.ME,
      });
      await userMonthCoverRepo.delete({ userId });
      mediaDeletionPlans.push(
        ...(await this.mediaService.deleteOrphanMediaCandidatesWithManager(
          manager,
          [...personalPostMediaIds, ...userMonthCoverMediaIds],
          { ignorePostIds: personalPostIds },
        )),
      );
      await refreshTokenRepo.update({ userId }, { revoked: true });
      await userRepo.softDelete(userId);
    });

    await this.postDraftCleanupService.notifyDraftInvalidations(
      draftInvalidations,
    );
    await this.mediaService.deleteMediaAssets(mediaDeletionPlans);
  }
}
