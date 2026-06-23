import type { Repository } from 'typeorm';

import { UserService } from './user.service';
import { User } from './entity/user.entity';
import { Post } from '../post/entity/post.entity';
import { PostBlock } from '../post/entity/post-block.entity';
import { PostMedia } from '../post/entity/post-media.entity';
import { UserMonthCover } from './entity/user-month-cover.entity';

import type { OAuthUserType } from '@/modules/auth/auth.type';

describe('UserService', () => {
  let userRepo: {
    findOne: jest.Mock;
    save: jest.Mock;
    create: jest.Mock;
    recover: jest.Mock;
  };
  let service: UserService;

  beforeEach(() => {
    userRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
      recover: jest.fn(),
    };

    service = new UserService(
      userRepo as unknown as Repository<User>,
      {} as Repository<Post>,
      {} as Repository<PostBlock>,
      {} as Repository<PostMedia>,
      {} as Repository<UserMonthCover>,
    );
  });

  describe('findOrCreateOAuthUser', () => {
    it('updates an active user when the same OAuth identity already exists', async () => {
      const params: OAuthUserType = {
        provider: 'kakao',
        providerId: 'oauth-1',
        email: 'new@example.com',
        nickname: 'new-name',
      };
      const existingUser = {
        id: 'user-1',
        provider: 'kakao',
        providerId: 'oauth-1',
        email: 'old@example.com',
        nickname: 'old-name',
        createdAt: new Date(),
      } as User;
      const savedUser = {
        ...existingUser,
        email: params.email,
        nickname: params.nickname,
      } as User;

      userRepo.findOne.mockResolvedValue(existingUser);
      userRepo.save.mockResolvedValue(savedUser);

      const result = await service.findOrCreateOAuthUser(params);

      expect(userRepo.findOne).toHaveBeenCalledWith({
        where: { provider: params.provider, providerId: params.providerId },
      });
      expect(userRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: existingUser.id,
          email: params.email,
          nickname: params.nickname,
        }),
      );
      expect(userRepo.create).not.toHaveBeenCalled();
      expect(userRepo.recover).not.toHaveBeenCalled();
      expect(result).toBe(savedUser);
    });

    it('creates a new user instead of recovering a soft-deleted account', async () => {
      const params: OAuthUserType = {
        provider: 'google',
        providerId: 'oauth-2',
        email: 'fresh@example.com',
        nickname: 'fresh-user',
      };
      const createdUser = {
        id: 'user-2',
        ...params,
        createdAt: new Date(),
      } as User;

      userRepo.findOne.mockImplementation((options) => {
        expect(options).toEqual({
          where: { provider: params.provider, providerId: params.providerId },
        });
        return null;
      });
      userRepo.create.mockReturnValue(createdUser);
      userRepo.save.mockResolvedValue(createdUser);

      const result = await service.findOrCreateOAuthUser(params);

      expect(userRepo.recover).not.toHaveBeenCalled();
      expect(userRepo.create).toHaveBeenCalledWith(params);
      expect(userRepo.save).toHaveBeenCalledWith(createdUser);
      expect(result).toBe(createdUser);
    });
  });
});
