import type { Repository } from 'typeorm';

import { GroupManagementService } from './group-management.service';
import { Group } from '../entity/group.entity';
import { GroupMember } from '../entity/group_member.entity';
import { GroupRoleEnum } from '@/enums/group-role.enum';
import { User } from '@/modules/user/entity/user.entity';
import { Post } from '@/modules/post/entity/post.entity';
import { PostMedia } from '@/modules/post/entity/post-media.entity';
import { MediaAsset } from '@/modules/media/entity/media-asset.entity';
import { MediaService } from '@/modules/media/media.service';
import { GroupActivityService } from './group-activity.service';
import { GroupService } from './group.service';
import {
  DraftInvalidationResult,
  PostDraftCleanupService,
} from '@/modules/post/post-draft-cleanup.service';

type RemoveMemberQueryBuilder = {
  where: jest.Mock;
  andWhere: jest.Mock;
  setLock: jest.Mock;
  getOne: jest.Mock;
};

type LeaveGroupQueryBuilder = {
  innerJoin: jest.Mock;
  where: jest.Mock;
  andWhere: jest.Mock;
  setLock: jest.Mock;
  getMany: jest.Mock;
};

type TxGroupMemberRepo = {
  createQueryBuilder: jest.Mock;
  softDelete: jest.Mock;
};

type TransactionManager = {
  getRepository: jest.Mock<TxGroupMemberRepo, [typeof GroupMember]>;
};

type TransactionCallback = (manager: TransactionManager) => Promise<void>;

type GroupMemberRepoWithManager = {
  manager: {
    transaction: jest.Mock<Promise<void>, [TransactionCallback]>;
  };
};

function createRemoveMemberQueryBuilder(
  member: Partial<GroupMember> | null,
): RemoveMemberQueryBuilder {
  return {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    setLock: jest.fn().mockReturnThis(),
    getOne: jest.fn().mockResolvedValue(member),
  };
}

function createLeaveGroupQueryBuilder(
  members: Partial<GroupMember>[],
): LeaveGroupQueryBuilder {
  return {
    innerJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    setLock: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue(members),
  };
}

describe('GroupManagementService', () => {
  let txGroupMemberRepo: TxGroupMemberRepo;
  let transactionManager: TransactionManager;
  let groupMemberRepo: GroupMemberRepoWithManager;
  let groupActivityService: {
    recordActivity: jest.Mock;
  };
  let mediaService: {
    markMediaDeletionCandidatesWithManager: jest.Mock;
    deleteMediaAssets: jest.Mock;
  };
  let postDraftCleanupService: {
    invalidateOwnedDraftsInGroupWithManager: jest.Mock;
    notifyDraftInvalidations: jest.Mock;
  };
  let service: GroupManagementService;

  beforeEach(() => {
    txGroupMemberRepo = {
      createQueryBuilder: jest.fn(),
      softDelete: jest.fn(),
    };
    transactionManager = {
      getRepository: jest.fn(() => txGroupMemberRepo),
    };
    groupMemberRepo = {
      manager: {
        transaction: jest.fn((callback: TransactionCallback) =>
          callback(transactionManager),
        ),
      },
    };
    groupActivityService = {
      recordActivity: jest.fn(),
    };
    mediaService = {
      markMediaDeletionCandidatesWithManager: jest.fn(),
      deleteMediaAssets: jest.fn(),
    };
    postDraftCleanupService = {
      invalidateOwnedDraftsInGroupWithManager: jest.fn(),
      notifyDraftInvalidations: jest.fn(),
    };

    service = new GroupManagementService(
      {} as Repository<Group>,
      groupMemberRepo as unknown as Repository<GroupMember>,
      {} as Repository<User>,
      {} as Repository<Post>,
      {} as Repository<PostMedia>,
      {} as Repository<MediaAsset>,
      groupActivityService as unknown as GroupActivityService,
      {} as GroupService,
      mediaService as unknown as MediaService,
      postDraftCleanupService as unknown as PostDraftCleanupService,
    );
  });

  it('cleans up the removed member profile media when removing a member', async () => {
    const draftInvalidation: DraftInvalidationResult = {
      draftIds: ['draft-1'],
      groupIds: ['group-1'],
      reason: 'GROUP_MEMBER_REMOVED',
      mediaDeletionCandidateIds: ['draft-media-1'],
    };
    txGroupMemberRepo.createQueryBuilder.mockReturnValue(
      createRemoveMemberQueryBuilder({
        id: 'member-1',
        userId: 'target-user',
        role: GroupRoleEnum.EDITOR,
        profileMediaId: 'profile-media-1',
      }),
    );
    txGroupMemberRepo.softDelete.mockResolvedValue({ affected: 1 });
    postDraftCleanupService.invalidateOwnedDraftsInGroupWithManager.mockResolvedValue(
      draftInvalidation,
    );
    postDraftCleanupService.notifyDraftInvalidations.mockResolvedValue(
      undefined,
    );
    mediaService.markMediaDeletionCandidatesWithManager.mockResolvedValue([
      'profile-media-1',
    ]);
    mediaService.deleteMediaAssets.mockResolvedValue(undefined);
    groupActivityService.recordActivity.mockResolvedValue(undefined);

    await service.removeMember('admin-user', 'group-1', 'target-user');

    expect(
      mediaService.markMediaDeletionCandidatesWithManager,
    ).toHaveBeenCalledWith(transactionManager, ['profile-media-1']);
    expect(mediaService.deleteMediaAssets).toHaveBeenCalledWith([
      'draft-media-1',
      'profile-media-1',
    ]);
  });

  it('cleans up the leaving member profile media when leaving a group', async () => {
    const draftInvalidation: DraftInvalidationResult = {
      draftIds: ['draft-1'],
      groupIds: ['group-1'],
      reason: 'GROUP_LEFT',
      mediaDeletionCandidateIds: ['draft-media-1'],
    };
    txGroupMemberRepo.createQueryBuilder.mockReturnValue(
      createLeaveGroupQueryBuilder([
        {
          id: 'member-1',
          userId: 'user-1',
          role: GroupRoleEnum.EDITOR,
          profileMediaId: 'profile-media-1',
        },
      ]),
    );
    txGroupMemberRepo.softDelete.mockResolvedValue({ affected: 1 });
    postDraftCleanupService.invalidateOwnedDraftsInGroupWithManager.mockResolvedValue(
      draftInvalidation,
    );
    postDraftCleanupService.notifyDraftInvalidations.mockResolvedValue(
      undefined,
    );
    mediaService.markMediaDeletionCandidatesWithManager.mockResolvedValue([
      'profile-media-1',
    ]);
    mediaService.deleteMediaAssets.mockResolvedValue(undefined);
    groupActivityService.recordActivity.mockResolvedValue(undefined);

    await service.leaveGroup('user-1', 'group-1');

    expect(
      mediaService.markMediaDeletionCandidatesWithManager,
    ).toHaveBeenCalledWith(transactionManager, ['profile-media-1']);
    expect(mediaService.deleteMediaAssets).toHaveBeenCalledWith([
      'draft-media-1',
      'profile-media-1',
    ]);
  });
});
