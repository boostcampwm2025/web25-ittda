import { BadRequestException } from '@nestjs/common';
import type { Repository } from 'typeorm';

import { MyPageService } from './mypage.service';
import { User } from '../user/entity/user.entity';
import { RefreshToken } from '../auth/refresh_token/refresh_token.entity';
import { Group } from '../group/entity/group.entity';

describe('MyPageService', () => {
  let userRepo: {
    findOneBy: jest.Mock;
    update: jest.Mock;
    save: jest.Mock;
    softDelete: jest.Mock;
  };
  let refreshTokenRepo: {
    update: jest.Mock;
  };
  let groupRepo: {
    find: jest.Mock;
  };
  let service: MyPageService;

  beforeEach(() => {
    userRepo = {
      findOneBy: jest.fn(),
      update: jest.fn(),
      save: jest.fn(),
      softDelete: jest.fn(),
    };
    refreshTokenRepo = {
      update: jest.fn(),
    };
    groupRepo = {
      find: jest.fn(),
    };

    service = new MyPageService(
      userRepo as unknown as Repository<User>,
      refreshTokenRepo as unknown as Repository<RefreshToken>,
      groupRepo as unknown as Repository<Group>,
    );
  });

  describe('withdraw', () => {
    it('soft deletes the user and revokes refresh tokens', async () => {
      groupRepo.find.mockResolvedValue([]);
      userRepo.softDelete.mockResolvedValue({ affected: 1 });
      refreshTokenRepo.update.mockResolvedValue({ affected: 2 });

      await service.withdraw('user-1');

      expect(groupRepo.find).toHaveBeenCalledWith({
        where: { owner: { id: 'user-1' } },
        select: {
          id: true,
          name: true,
        },
      });
      expect(userRepo.softDelete).toHaveBeenCalledWith({ id: 'user-1' });
      expect(refreshTokenRepo.update).toHaveBeenCalledWith(
        { userId: 'user-1' },
        { revoked: true },
      );
    });

    it('throws when the user is already deleted or missing', async () => {
      groupRepo.find.mockResolvedValue([]);
      userRepo.softDelete.mockResolvedValue({ affected: 0 });

      await expect(service.withdraw('missing-user')).rejects.toThrow(
        BadRequestException,
      );
      expect(refreshTokenRepo.update).not.toHaveBeenCalled();
    });

    it('throws when the user owns groups and skips withdrawal', async () => {
      groupRepo.find.mockResolvedValue([
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

      expect(userRepo.softDelete).not.toHaveBeenCalled();
      expect(refreshTokenRepo.update).not.toHaveBeenCalled();
    });
  });
});
