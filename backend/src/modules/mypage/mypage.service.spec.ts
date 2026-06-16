import { BadRequestException } from '@nestjs/common';
import type { Repository } from 'typeorm';

import { MyPageService } from './mypage.service';
import { User } from '../user/entity/user.entity';
import { RefreshToken } from '../auth/refresh_token/refresh_token.entity';
import { GroupMember } from '../group/entity/group_member.entity';
import { Post } from '../post/entity/post.entity';
import { GroupRoleEnum } from '@/enums/group-role.enum';
import { PostScope } from '@/enums/post-scope.enum';
import { TemplateScope } from '@/enums/template-scope.enum';
import { GroupService } from '../group/service/group.service';
import { PostDraftCleanupService } from '../post/post-draft-cleanup.service';
import { Template } from '../template/entity/template.entity';
import { UserMonthCover } from '../user/entity/user-month-cover.entity';
import { MediaService } from '../media/media.service';

type MembershipRecord = Pick<
  GroupMember,
  'id' | 'groupId' | 'userId' | 'role' | 'joinedAt' | 'profileMediaId'
>;

type UserQueryBuilder = {
  where: jest.Mock;
  setLock: jest.Mock;
  getOne: jest.Mock;
};

type GroupMemberQueryBuilder = {
  where: jest.Mock;
  orderBy: jest.Mock;
  setLock: jest.Mock;
  getMany: jest.Mock;
};

type TxGroupMemberRepo = {
  createQueryBuilder: jest.Mock;
  softDelete: jest.Mock;
  save: jest.Mock;
};

type TxPostRepo = {
  find: jest.Mock;
  update: jest.Mock;
  softDelete: jest.Mock;
};

type TxTemplateRepo = {
  softDelete: jest.Mock;
};

type TxUserMonthCoverRepo = {
  delete: jest.Mock;
};

type TxRefreshTokenRepo = {
  update: jest.Mock;
};

type TxUserRepo = {
  createQueryBuilder: jest.Mock;
  softDelete: jest.Mock;
};

type TxEntity =
  | typeof GroupMember
  | typeof Post
  | typeof Template
  | typeof UserMonthCover
  | typeof RefreshToken
  | typeof User;

type TxRepository =
  | TxGroupMemberRepo
  | TxPostRepo
  | TxTemplateRepo
  | TxUserMonthCoverRepo
  | TxRefreshTokenRepo
  | TxUserRepo;

type TransactionLookupManager = {
  getRepository: jest.Mock<TxRepository, [TxEntity]>;
};

type TransactionCallback = (manager: TransactionLookupManager) => Promise<void>;

type MockTransactionManager = TransactionLookupManager & {
  transaction: jest.Mock<Promise<void>, [TransactionCallback]>;
};

function createUserQueryBuilder(user: Partial<User> | null): UserQueryBuilder {
  return {
    where: jest.fn().mockReturnThis(),
    setLock: jest.fn().mockReturnThis(),
    getOne: jest.fn().mockResolvedValue(user),
  };
}

function createMembershipQueryBuilder(
  memberships: MembershipRecord[],
): GroupMemberQueryBuilder {
  return {
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    setLock: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue(memberships),
  };
}

describe('MyPageService', () => {
  let userRepo: {
    findOneBy: jest.Mock;
    update: jest.Mock;
    save: jest.Mock;
    manager: MockTransactionManager;
  };
  let txGroupMemberRepo: TxGroupMemberRepo;
  let txPostRepo: TxPostRepo;
  let txTemplateRepo: TxTemplateRepo;
  let txUserMonthCoverRepo: TxUserMonthCoverRepo;
  let txRefreshTokenRepo: TxRefreshTokenRepo;
  let txUserRepo: TxUserRepo;
  let transactionManager: MockTransactionManager;
  let groupService: {
    deleteGroupWithManager: jest.Mock;
  };
  let mediaService: {
    collectPostMediaIdsWithManager: jest.Mock;
    collectUserMonthCoverMediaIdsWithManager: jest.Mock;
    deleteOrphanMediaCandidatesWithManager: jest.Mock;
    deleteMediaAssets: jest.Mock;
  };
  let postDraftCleanupService: {
    invalidateOwnedDraftsInGroupWithManager: jest.Mock;
    notifyDraftInvalidations: jest.Mock;
  };
  let service: MyPageService;

  beforeEach(() => {
    txGroupMemberRepo = {
      createQueryBuilder: jest.fn(),
      softDelete: jest.fn(),
      save: jest.fn(),
    };
    txPostRepo = {
      find: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
    };
    txTemplateRepo = {
      softDelete: jest.fn(),
    };
    txUserMonthCoverRepo = {
      delete: jest.fn(),
    };
    txRefreshTokenRepo = {
      update: jest.fn(),
    };
    txUserRepo = {
      createQueryBuilder: jest.fn(),
      softDelete: jest.fn(),
    };

    transactionManager = {
      transaction: jest.fn((callback: TransactionCallback) =>
        callback(transactionManager),
      ),
      getRepository: jest.fn((entity: TxEntity): TxRepository => {
        if (entity === GroupMember) return txGroupMemberRepo;
        if (entity === Post) return txPostRepo;
        if (entity === Template) return txTemplateRepo;
        if (entity === UserMonthCover) return txUserMonthCoverRepo;
        if (entity === RefreshToken) return txRefreshTokenRepo;
        if (entity === User) return txUserRepo;
        throw new Error(`Unexpected repository request: ${String(entity)}`);
      }),
    };

    userRepo = {
      findOneBy: jest.fn(),
      update: jest.fn(),
      save: jest.fn(),
      manager: transactionManager,
    };

    groupService = {
      deleteGroupWithManager: jest.fn(),
    };
    mediaService = {
      collectPostMediaIdsWithManager: jest.fn(),
      collectUserMonthCoverMediaIdsWithManager: jest.fn(),
      deleteOrphanMediaCandidatesWithManager: jest.fn(),
      deleteMediaAssets: jest.fn(),
    };
    postDraftCleanupService = {
      invalidateOwnedDraftsInGroupWithManager: jest.fn(),
      notifyDraftInvalidations: jest.fn(),
    };

    service = new MyPageService(
      userRepo as unknown as Repository<User>,
      groupService as unknown as GroupService,
      mediaService as unknown as MediaService,
      postDraftCleanupService as unknown as PostDraftCleanupService,
    );
  });

  describe('withdraw', () => {
    it('deletes solo admin groups, transfers admin, and clears memberships before soft deleting the user', async () => {
      const joinedAt = new Date('2026-05-02T00:00:00.000Z');

      txUserRepo.createQueryBuilder.mockReturnValue(
        createUserQueryBuilder({ id: 'user-1' }),
      );
      txGroupMemberRepo.createQueryBuilder
        .mockReturnValueOnce(
          createMembershipQueryBuilder([
            {
              id: 'gm-admin-solo',
              groupId: 'group-1',
              userId: 'user-1',
              role: GroupRoleEnum.ADMIN,
              joinedAt,
              profileMediaId: null,
            },
            {
              id: 'gm-admin-transfer',
              groupId: 'group-2',
              userId: 'user-1',
              role: GroupRoleEnum.ADMIN,
              joinedAt,
              profileMediaId: 'profile-group-2',
            },
            {
              id: 'gm-viewer',
              groupId: 'group-3',
              userId: 'user-1',
              role: GroupRoleEnum.VIEWER,
              joinedAt,
              profileMediaId: 'profile-group-3',
            },
          ]),
        )
        .mockReturnValueOnce(
          createMembershipQueryBuilder([
            {
              id: 'gm-admin-solo',
              groupId: 'group-1',
              userId: 'user-1',
              role: GroupRoleEnum.ADMIN,
              joinedAt,
              profileMediaId: null,
            },
          ]),
        )
        .mockReturnValueOnce(
          createMembershipQueryBuilder([
            {
              id: 'gm-admin-transfer',
              groupId: 'group-2',
              userId: 'user-1',
              role: GroupRoleEnum.ADMIN,
              joinedAt: new Date('2026-05-01T00:00:00.000Z'),
              profileMediaId: 'profile-group-2',
            },
            {
              id: 'gm-editor',
              groupId: 'group-2',
              userId: 'user-2',
              role: GroupRoleEnum.EDITOR,
              joinedAt: new Date('2026-04-01T00:00:00.000Z'),
            },
            {
              id: 'gm-viewer-2',
              groupId: 'group-2',
              userId: 'user-3',
              role: GroupRoleEnum.VIEWER,
              joinedAt: new Date('2026-03-01T00:00:00.000Z'),
            },
          ]),
        );
      txPostRepo.find.mockResolvedValue([{ id: 'personal-post-1' }]);
      mediaService.collectPostMediaIdsWithManager.mockResolvedValue([
        'personal-media-1',
      ]);
      mediaService.collectUserMonthCoverMediaIdsWithManager.mockResolvedValue([
        'month-cover-1',
      ]);
      groupService.deleteGroupWithManager.mockResolvedValue({
        draftIds: ['draft-group-1'],
        groupIds: ['group-1'],
        reason: 'GROUP_DELETED',
        mediaDeletionPlans: [{ id: 'group-1-media', storageKey: 'group/1' }],
      });
      postDraftCleanupService.invalidateOwnedDraftsInGroupWithManager
        .mockResolvedValueOnce({
          draftIds: ['draft-group-2'],
          groupIds: ['group-2'],
          reason: 'OWNER_WITHDRAWN',
          mediaDeletionPlans: [{ id: 'draft-2-media', storageKey: 'draft/2' }],
        })
        .mockResolvedValueOnce({
          draftIds: [],
          groupIds: [],
          reason: 'OWNER_WITHDRAWN',
          mediaDeletionPlans: [],
        });
      mediaService.deleteOrphanMediaCandidatesWithManager
        .mockResolvedValueOnce([{ id: 'profile-group-2', storageKey: 'gm/2' }])
        .mockResolvedValueOnce([{ id: 'profile-group-3', storageKey: 'gm/3' }])
        .mockResolvedValueOnce([
          { id: 'personal-media-1', storageKey: 'post/1' },
          { id: 'month-cover-1', storageKey: 'cover/1' },
        ]);
      postDraftCleanupService.notifyDraftInvalidations.mockResolvedValue(
        undefined,
      );
      mediaService.deleteMediaAssets.mockResolvedValue(undefined);
      txGroupMemberRepo.save.mockResolvedValue(undefined);
      txGroupMemberRepo.softDelete.mockResolvedValue({ affected: 1 });
      txPostRepo.update.mockResolvedValue({ affected: 2 });
      txPostRepo.softDelete.mockResolvedValue({ affected: 3 });
      txTemplateRepo.softDelete.mockResolvedValue({ affected: 2 });
      txUserMonthCoverRepo.delete.mockResolvedValue({ affected: 2 });
      txRefreshTokenRepo.update.mockResolvedValue({ affected: 2 });
      txUserRepo.softDelete.mockResolvedValue({ affected: 1 });

      await service.withdraw('user-1');

      expect(userRepo.manager.transaction).toHaveBeenCalledTimes(1);
      expect(txPostRepo.find).toHaveBeenCalledWith({
        where: { ownerUserId: 'user-1', scope: PostScope.PERSONAL },
        select: { id: true },
      });
      expect(groupService.deleteGroupWithManager).toHaveBeenCalledWith(
        transactionManager,
        'group-1',
      );
      expect(
        postDraftCleanupService.invalidateOwnedDraftsInGroupWithManager,
      ).toHaveBeenCalledWith(
        transactionManager,
        'user-1',
        'group-2',
        'OWNER_WITHDRAWN',
      );
      expect(
        postDraftCleanupService.invalidateOwnedDraftsInGroupWithManager,
      ).toHaveBeenCalledWith(
        transactionManager,
        'user-1',
        'group-3',
        'OWNER_WITHDRAWN',
      );
      expect(txGroupMemberRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'gm-editor',
          role: GroupRoleEnum.ADMIN,
        }),
      );
      expect(txGroupMemberRepo.softDelete).toHaveBeenCalledWith(
        'gm-admin-transfer',
      );
      expect(txGroupMemberRepo.softDelete).toHaveBeenCalledWith('gm-viewer');
      expect(txPostRepo.update).toHaveBeenCalledWith(
        { ownerUserId: 'user-1' },
        { shareToken: null },
      );
      expect(txPostRepo.softDelete).toHaveBeenCalledWith({
        ownerUserId: 'user-1',
        scope: PostScope.PERSONAL,
      });
      expect(txTemplateRepo.softDelete).toHaveBeenCalledWith({
        ownerUserId: 'user-1',
        scope: TemplateScope.ME,
      });
      expect(txUserMonthCoverRepo.delete).toHaveBeenCalledWith({
        userId: 'user-1',
      });
      expect(txRefreshTokenRepo.update).toHaveBeenCalledWith(
        { userId: 'user-1' },
        { revoked: true },
      );
      expect(txUserRepo.softDelete).toHaveBeenCalledWith('user-1');
      expect(
        postDraftCleanupService.notifyDraftInvalidations,
      ).toHaveBeenCalledWith([
        {
          draftIds: ['draft-group-1'],
          groupIds: ['group-1'],
          reason: 'GROUP_DELETED',
          mediaDeletionPlans: [{ id: 'group-1-media', storageKey: 'group/1' }],
        },
        {
          draftIds: ['draft-group-2'],
          groupIds: ['group-2'],
          reason: 'OWNER_WITHDRAWN',
          mediaDeletionPlans: [{ id: 'draft-2-media', storageKey: 'draft/2' }],
        },
        {
          draftIds: [],
          groupIds: [],
          reason: 'OWNER_WITHDRAWN',
          mediaDeletionPlans: [],
        },
      ]);
      expect(mediaService.deleteMediaAssets).toHaveBeenCalledWith([
        { id: 'group-1-media', storageKey: 'group/1' },
        { id: 'draft-2-media', storageKey: 'draft/2' },
        { id: 'profile-group-2', storageKey: 'gm/2' },
        { id: 'profile-group-3', storageKey: 'gm/3' },
        { id: 'personal-media-1', storageKey: 'post/1' },
        { id: 'month-cover-1', storageKey: 'cover/1' },
      ]);
    });

    it('soft deletes the admin membership when another admin already exists', async () => {
      const joinedAt = new Date('2026-05-02T00:00:00.000Z');

      txUserRepo.createQueryBuilder.mockReturnValue(
        createUserQueryBuilder({ id: 'user-1' }),
      );
      txGroupMemberRepo.createQueryBuilder
        .mockReturnValueOnce(
          createMembershipQueryBuilder([
            {
              id: 'gm-admin',
              groupId: 'group-1',
              userId: 'user-1',
              role: GroupRoleEnum.ADMIN,
              joinedAt,
              profileMediaId: 'profile-group-1',
            },
          ]),
        )
        .mockReturnValueOnce(
          createMembershipQueryBuilder([
            {
              id: 'gm-admin',
              groupId: 'group-1',
              userId: 'user-1',
              role: GroupRoleEnum.ADMIN,
              joinedAt,
              profileMediaId: 'profile-group-1',
            },
            {
              id: 'gm-admin-2',
              groupId: 'group-1',
              userId: 'user-2',
              role: GroupRoleEnum.ADMIN,
              joinedAt: new Date('2026-04-01T00:00:00.000Z'),
            },
          ]),
        );
      txPostRepo.find.mockResolvedValue([]);
      mediaService.collectPostMediaIdsWithManager.mockResolvedValue([]);
      mediaService.collectUserMonthCoverMediaIdsWithManager.mockResolvedValue(
        [],
      );
      postDraftCleanupService.invalidateOwnedDraftsInGroupWithManager.mockResolvedValue(
        {
          draftIds: ['draft-group-1'],
          groupIds: ['group-1'],
          reason: 'OWNER_WITHDRAWN',
          mediaDeletionPlans: [
            { id: 'draft-group-1-media', storageKey: 'd/1' },
          ],
        },
      );
      mediaService.deleteOrphanMediaCandidatesWithManager
        .mockResolvedValueOnce([{ id: 'profile-group-1', storageKey: 'gm/1' }])
        .mockResolvedValueOnce([]);
      postDraftCleanupService.notifyDraftInvalidations.mockResolvedValue(
        undefined,
      );
      mediaService.deleteMediaAssets.mockResolvedValue(undefined);
      txGroupMemberRepo.softDelete.mockResolvedValue({ affected: 1 });
      txPostRepo.update.mockResolvedValue({ affected: 1 });
      txPostRepo.softDelete.mockResolvedValue({ affected: 2 });
      txTemplateRepo.softDelete.mockResolvedValue({ affected: 1 });
      txUserMonthCoverRepo.delete.mockResolvedValue({ affected: 1 });
      txRefreshTokenRepo.update.mockResolvedValue({ affected: 1 });
      txUserRepo.softDelete.mockResolvedValue({ affected: 1 });

      await service.withdraw('user-1');

      expect(groupService.deleteGroupWithManager).not.toHaveBeenCalled();
      expect(txGroupMemberRepo.save).not.toHaveBeenCalled();
      expect(txGroupMemberRepo.softDelete).toHaveBeenCalledWith('gm-admin');
      expect(txPostRepo.softDelete).toHaveBeenCalledWith({
        ownerUserId: 'user-1',
        scope: PostScope.PERSONAL,
      });
      expect(txTemplateRepo.softDelete).toHaveBeenCalledWith({
        ownerUserId: 'user-1',
        scope: TemplateScope.ME,
      });
      expect(txUserMonthCoverRepo.delete).toHaveBeenCalledWith({
        userId: 'user-1',
      });
      expect(txUserRepo.softDelete).toHaveBeenCalledWith('user-1');
      expect(
        postDraftCleanupService.notifyDraftInvalidations,
      ).toHaveBeenCalledWith([
        {
          draftIds: ['draft-group-1'],
          groupIds: ['group-1'],
          reason: 'OWNER_WITHDRAWN',
          mediaDeletionPlans: [
            { id: 'draft-group-1-media', storageKey: 'd/1' },
          ],
        },
      ]);
      expect(mediaService.deleteMediaAssets).toHaveBeenCalledWith([
        { id: 'draft-group-1-media', storageKey: 'd/1' },
        { id: 'profile-group-1', storageKey: 'gm/1' },
      ]);
    });

    it('deletes the group instead of promoting a viewer when only viewers remain', async () => {
      const joinedAt = new Date('2026-05-02T00:00:00.000Z');

      txUserRepo.createQueryBuilder.mockReturnValue(
        createUserQueryBuilder({ id: 'user-1' }),
      );
      txGroupMemberRepo.createQueryBuilder
        .mockReturnValueOnce(
          createMembershipQueryBuilder([
            {
              id: 'gm-admin',
              groupId: 'group-1',
              userId: 'user-1',
              role: GroupRoleEnum.ADMIN,
              joinedAt,
              profileMediaId: 'profile-group-1',
            },
          ]),
        )
        .mockReturnValueOnce(
          createMembershipQueryBuilder([
            {
              id: 'gm-admin',
              groupId: 'group-1',
              userId: 'user-1',
              role: GroupRoleEnum.ADMIN,
              joinedAt,
              profileMediaId: 'profile-group-1',
            },
            {
              id: 'gm-viewer',
              groupId: 'group-1',
              userId: 'user-2',
              role: GroupRoleEnum.VIEWER,
              joinedAt: new Date('2026-04-01T00:00:00.000Z'),
              profileMediaId: null,
            },
          ]),
        );
      txPostRepo.find.mockResolvedValue([]);
      mediaService.collectPostMediaIdsWithManager.mockResolvedValue([]);
      mediaService.collectUserMonthCoverMediaIdsWithManager.mockResolvedValue(
        [],
      );
      groupService.deleteGroupWithManager.mockResolvedValue({
        draftIds: ['draft-group-1'],
        groupIds: ['group-1'],
        reason: 'GROUP_DELETED',
        mediaDeletionPlans: [{ id: 'group-1-media', storageKey: 'group/1' }],
      });
      mediaService.deleteOrphanMediaCandidatesWithManager.mockResolvedValueOnce(
        [],
      );
      postDraftCleanupService.notifyDraftInvalidations.mockResolvedValue(
        undefined,
      );
      mediaService.deleteMediaAssets.mockResolvedValue(undefined);
      txPostRepo.update.mockResolvedValue({ affected: 1 });
      txPostRepo.softDelete.mockResolvedValue({ affected: 1 });
      txTemplateRepo.softDelete.mockResolvedValue({ affected: 1 });
      txUserMonthCoverRepo.delete.mockResolvedValue({ affected: 1 });
      txRefreshTokenRepo.update.mockResolvedValue({ affected: 1 });
      txUserRepo.softDelete.mockResolvedValue({ affected: 1 });

      await service.withdraw('user-1');

      expect(groupService.deleteGroupWithManager).toHaveBeenCalledWith(
        transactionManager,
        'group-1',
      );
      expect(txGroupMemberRepo.save).not.toHaveBeenCalled();
      expect(txGroupMemberRepo.softDelete).not.toHaveBeenCalled();
      expect(
        postDraftCleanupService.invalidateOwnedDraftsInGroupWithManager,
      ).not.toHaveBeenCalled();
      expect(txUserRepo.softDelete).toHaveBeenCalledWith('user-1');
      expect(
        postDraftCleanupService.notifyDraftInvalidations,
      ).toHaveBeenCalledWith([
        {
          draftIds: ['draft-group-1'],
          groupIds: ['group-1'],
          reason: 'GROUP_DELETED',
          mediaDeletionPlans: [{ id: 'group-1-media', storageKey: 'group/1' }],
        },
      ]);
      expect(mediaService.deleteMediaAssets).toHaveBeenCalledWith([
        { id: 'group-1-media', storageKey: 'group/1' },
      ]);
    });

    it('throws when the user is already deleted or missing', async () => {
      txUserRepo.createQueryBuilder.mockReturnValue(
        createUserQueryBuilder(null),
      );

      await expect(service.withdraw('missing-user')).rejects.toThrow(
        new BadRequestException(
          '존재하지 않는 사용자이거나 이미 탈퇴 처리되었습니다.',
        ),
      );

      expect(txGroupMemberRepo.createQueryBuilder).not.toHaveBeenCalled();
      expect(txPostRepo.update).not.toHaveBeenCalled();
      expect(txPostRepo.find).not.toHaveBeenCalled();
      expect(txPostRepo.softDelete).not.toHaveBeenCalled();
      expect(txTemplateRepo.softDelete).not.toHaveBeenCalled();
      expect(txUserMonthCoverRepo.delete).not.toHaveBeenCalled();
      expect(txRefreshTokenRepo.update).not.toHaveBeenCalled();
      expect(txUserRepo.softDelete).not.toHaveBeenCalled();
      expect(
        postDraftCleanupService.notifyDraftInvalidations,
      ).not.toHaveBeenCalled();
      expect(mediaService.deleteMediaAssets).not.toHaveBeenCalled();
    });
  });
});
