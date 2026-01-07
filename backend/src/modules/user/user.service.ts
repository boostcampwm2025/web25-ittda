import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import type { OAuthUserType } from '../auth/auth.type';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async findOrCreateOAuthUser(params: OAuthUserType): Promise<User> {
    const { provider, providerId } = params;

    let user = await this.userRepo.findOne({
      where: { provider, providerId },
    });

    if (!user) {
      user = this.userRepo.create(params);
      await this.userRepo.save(user);
    }

    return user;
  }
}
