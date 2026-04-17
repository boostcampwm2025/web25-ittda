import { BadRequestException } from '@nestjs/common';
import type { Repository } from 'typeorm';

import { MyPageService } from './mypage.service';
import { User } from '../user/entity/user.entity';
import { RefreshToken } from '../auth/refresh_token/refresh_token.entity';
import { Group } from '../group/entity/group.entity';
import { Post } from '../post/entity/post.entity';

type TxGroupRepo = {
  find: jest.Mock;
};

type TxPostRepo = {
  update: jest.Mock;
};

type TxRefreshTokenRepo = {
  update: jest.Mock;
};

type TxUserRepo = {
  softDelete: jest.Mock;
};

type TxEntity = typeof Group | typeof Post | typeof RefreshToken | typeof User;
type TxRepository = TxGroupRepo | TxPostRepo | TxRefreshTokenRepo | TxUserRepo;

type TransactionLookupManager = {
  getRepository: (entity: TxEntity) => TxRepository;
};

type TransactionCallback = (manager: TransactionLookupManager) => Promise<void>;

type MockTransactionManager = {
  transaction: jest.Mock<Promise<void>, [TransactionCallback]>;
  getRepository: jest.Mock<TxRepository, [TxEntity]>;
};

describe('MyPageService', () => {
  let userRepo: {
    findOneBy: jest.Mock;
    update: jest.Mock;
    save: jest.Mock;
    softDelete: jest.Mock;
    manager: MockTransactionManager;
  };
  let groupRepo: Record<string, never>;
  let txGroupRepo: TxGroupRepo;
  let txPostRepo: TxPostRepo;
  let txRefreshTokenRepo: TxRefreshTokenRepo;
  let txUserRepo: TxUserRepo;
  let transactionManager: MockTransactionManager;
  let service: MyPageService;

  beforeEach(() => {
    txGroupRepo = {
      find: jest.fn(),
    };
    txPostRepo = {
      update: jest.fn(),
    };
    txRefreshTokenRepo = {
      update: jest.fn(),
    };
    txUserRepo = {
      softDelete: jest.fn(),
    };
    transactionManager = {
      transaction: jest.fn((callback: TransactionCallback) =>
        callback(transactionManager),
      ),
      getRepository: jest.fn((entity: TxEntity): TxRepository => {
        if (entity === Group) return txGroupRepo;
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
      softDelete: jest.fn(),
      manager: transactionManager,
    };
    groupRepo = {};

    service = new MyPageService(
      userRepo as unknown as Repository<User>,
      txRefreshTokenRepo as unknown as Repository<RefreshToken>,
      groupRepo as unknown as Repository<Group>,
    );
  });

  describe('withdraw', () => {
    it('revokes share tokens, revokes refresh tokens, and soft deletes the user', async () => {
      txGroupRepo.find.mockResolvedValue([]);
      txPostRepo.update.mockResolvedValue({ affected: 2 });
      txRefreshTokenRepo.update.mockResolvedValue({ affected: 2 });
      txUserRepo.softDelete.mockResolvedValue({ affected: 1 });

      await service.withdraw('user-1');

      expect(userRepo.manager.transaction).toHaveBeenCalledTimes(1);
      expect(txGroupRepo.find).toHaveBeenCalledWith({
        where: { owner: { id: 'user-1' } },
        select: {
          id: true,
          name: true,
        },
      });
      expect(txPostRepo.update).toHaveBeenCalledWith(
        { ownerUserId: 'user-1' },
        { shareToken: null },
      );
      expect(txRefreshTokenRepo.update).toHaveBeenCalledWith(
        { userId: 'user-1' },
        { revoked: true },
      );
      expect(txUserRepo.softDelete).toHaveBeenCalledWith({ id: 'user-1' });
    });

    it('throws when the user is already deleted or missing', async () => {
      txGroupRepo.find.mockResolvedValue([]);
      txPostRepo.update.mockResolvedValue({ affected: 0 });
      txRefreshTokenRepo.update.mockResolvedValue({ affected: 0 });
      txUserRepo.softDelete.mockResolvedValue({ affected: 0 });

      await expect(service.withdraw('missing-user')).rejects.toThrow(
        BadRequestException,
      );
      expect(txRefreshTokenRepo.update).toHaveBeenCalledWith(
        { userId: 'missing-user' },
        { revoked: true },
      );
    });

    it('throws when the user owns groups and skips withdrawal', async () => {
      txGroupRepo.find.mockResolvedValue([
        {
          id: 'group-1',
          name: '여행기록방',
        },
      ]);

      await expect(service.withdraw('owner-user')).rejects.toThrow(
        new BadRequestException(
          '사용자가 소유한 그룹 "여행기록방"이 존재합니다. 그룹을 삭제하거나 소유권을 이전한 후 다시 시도해주세요.',
        ),
      );

      expect(txPostRepo.update).not.toHaveBeenCalled();
      expect(txUserRepo.softDelete).not.toHaveBeenCalled();
      expect(txRefreshTokenRepo.update).not.toHaveBeenCalled();
    });
  });
});
