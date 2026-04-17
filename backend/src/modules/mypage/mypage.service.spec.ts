import { BadRequestException } from '@nestjs/common';
import type { Repository } from 'typeorm';

import { MyPageService } from './mypage.service';
import { User } from '../user/entity/user.entity';
import { RefreshToken } from '../auth/refresh_token/refresh_token.entity';

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

    service = new MyPageService(
      userRepo as unknown as Repository<User>,
      refreshTokenRepo as unknown as Repository<RefreshToken>,
    );
  });

  describe('withdraw', () => {
    it('soft deletes the user and revokes refresh tokens', async () => {
      userRepo.softDelete.mockResolvedValue({ affected: 1 });
      refreshTokenRepo.update.mockResolvedValue({ affected: 2 });

      await service.withdraw('user-1');

      expect(userRepo.softDelete).toHaveBeenCalledWith({ id: 'user-1' });
      expect(refreshTokenRepo.update).toHaveBeenCalledWith(
        { userId: 'user-1' },
        { revoked: true },
      );
    });

    it('throws when the user is already deleted or missing', async () => {
      userRepo.softDelete.mockResolvedValue({ affected: 0 });

      await expect(service.withdraw('missing-user')).rejects.toThrow(
        BadRequestException,
      );
      expect(refreshTokenRepo.update).not.toHaveBeenCalled();
    });
  });
});
