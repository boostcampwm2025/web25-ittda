import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, OAuthProvider } from './user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async findOrCreateOAuthUser(params: {
    provider: OAuthProvider;
    providerId: string;
    email?: string;
    nickname: string;
  }): Promise<User> {
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
