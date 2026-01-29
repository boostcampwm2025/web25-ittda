import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GuestSession } from './guest-session.entity';
import { UserService } from '../user/user.service';
import { randomUUID } from 'crypto';

@Injectable()
export class GuestSessionService {
  constructor(
    @InjectRepository(GuestSession)
    private readonly guestSessionRepo: Repository<GuestSession>,
    private readonly userService: UserService,
  ) {}

  async create(): Promise<GuestSession> {
    // 1. 임시 게스트 유저 생성
    const guestUser = await this.userService.findOrCreateOAuthUser({
      provider: 'guest',
      providerId: randomUUID(),
      nickname: '게스트',
    });

    // 2. 3일 후 만료되는 게스트 세션 생성
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 3); // 3일
    return this.guestSessionRepo.save({
      expiresAt,
      userId: guestUser.id,
    });
  }

  async validate(id: string): Promise<GuestSession | null> {
    return this.guestSessionRepo.findOne({
      where: { id },
    });
  }

  async invalidate(id: string) {
    await this.guestSessionRepo.delete(id);
  }
}
