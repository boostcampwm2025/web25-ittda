import { BadRequestException } from '@nestjs/common';
import type { Repository } from 'typeorm';

import { MyPageService } from './mypage.service';
import { User } from '../user/entity/user.entity';
import { RefreshToken } from '../auth/refresh_token/refresh_token.entity';
import { Group } from '../group/entity/group.entity';
import { GroupMember } from '../group/entity/group_member.entity';
import { Post } from '../post/entity/post.entity';
import { GroupRoleEnum } from '@/enums/group-role.enum';

type MembershipRecord = Pick<
  GroupMember,
  'id' | 'groupId' | 'userId' | 'role' | 'joinedAt'
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

type TxGroupRepo = {
  delete: jest.Mock;
};

type TxGroupMemberRepo = {
  createQueryBuilder: jest.Mock;
  softDelete: jest.Mock;
  save: jest.Mock;
};

type TxPostRepo = {
  update: jest.Mock;
};

type TxRefreshTokenRepo = {
  update: jest.Mock;
};

type TxUserRepo = {
  createQueryBuilder: jest.Mock;
  softDelete: jest.Mock;
};

type TxEntity =
  | typeof Group
  | typeof GroupMember
  | typeof Post
  | typeof RefreshToken
  | typeof User;

type TxRepository =
  | TxGroupRepo
  | TxGroupMemberRepo
  | TxPostRepo
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
  let txGroupRepo: TxGroupRepo;
  let txGroupMemberRepo: TxGroupMemberRepo;
  let txPostRepo: TxPostRepo;
  let txRefreshTokenRepo: TxRefreshTokenRepo;
  let txUserRepo: TxUserRepo;
  let transactionManager: MockTransactionManager;
  let service: MyPageService;

  beforeEach(() => {
    txGroupRepo = {
      delete: jest.fn(),
    };
    txGroupMemberRepo = {
      createQueryBuilder: jest.fn(),
      softDelete: jest.fn(),
      save: jest.fn(),
    };
    txPostRepo = {
      update: jest.fn(),
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
        if (entity === Group) return txGroupRepo;
        if (entity === GroupMember) return txGroupMemberRepo;
        if (entity === Post) return txPostRepo;
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

    service = new MyPageService(userRepo as unknown as Repository<User>);
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
            },
            {
              id: 'gm-admin-transfer',
              groupId: 'group-2',
              userId: 'user-1',
              role: GroupRoleEnum.ADMIN,
              joinedAt,
            },
            {
              id: 'gm-viewer',
              groupId: 'group-3',
              userId: 'user-1',
              role: GroupRoleEnum.VIEWER,
              joinedAt,
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
      txGroupRepo.delete.mockResolvedValue({ affected: 1 });
      txGroupMemberRepo.save.mockResolvedValue(undefined);
      txGroupMemberRepo.softDelete.mockResolvedValue({ affected: 1 });
      txPostRepo.update.mockResolvedValue({ affected: 2 });
      txRefreshTokenRepo.update.mockResolvedValue({ affected: 2 });
      txUserRepo.softDelete.mockResolvedValue({ affected: 1 });

      await service.withdraw('user-1');

      expect(userRepo.manager.transaction).toHaveBeenCalledTimes(1);
      expect(txGroupRepo.delete).toHaveBeenCalledWith('group-1');
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
      expect(txRefreshTokenRepo.update).toHaveBeenCalledWith(
        { userId: 'user-1' },
        { revoked: true },
      );
      expect(txUserRepo.softDelete).toHaveBeenCalledWith('user-1');
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
      txGroupMemberRepo.softDelete.mockResolvedValue({ affected: 1 });
      txPostRepo.update.mockResolvedValue({ affected: 1 });
      txRefreshTokenRepo.update.mockResolvedValue({ affected: 1 });
      txUserRepo.softDelete.mockResolvedValue({ affected: 1 });

      await service.withdraw('user-1');

      expect(txGroupRepo.delete).not.toHaveBeenCalled();
      expect(txGroupMemberRepo.save).not.toHaveBeenCalled();
      expect(txGroupMemberRepo.softDelete).toHaveBeenCalledWith('gm-admin');
      expect(txUserRepo.softDelete).toHaveBeenCalledWith('user-1');
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
      expect(txRefreshTokenRepo.update).not.toHaveBeenCalled();
      expect(txUserRepo.softDelete).not.toHaveBeenCalled();
    });
  });
});
