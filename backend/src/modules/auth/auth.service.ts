import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { randomUUID } from 'crypto';
import { GuestSessionService } from '../guest/guest-session.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RefreshToken } from './refresh_token/refresh_token.entity';

import type { OAuthUserType } from './auth.type';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepo: Repository<RefreshToken>,
    private readonly guestSessionService: GuestSessionService,
  ) {}

  async oauthLogin(oauthUser: OAuthUserType, guestSessionId?: string) {
    const user = await this.userService.findOrCreateOAuthUser(oauthUser);

    const accessToken = this.jwtService.sign(
      { sub: user.id },
      { expiresIn: '15m' },
    );

    const refreshToken = randomUUID();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 14);

    await this.refreshTokenRepo.save({
      userId: user.id,
      token: refreshToken,
      expiresAt,
    });

    if (guestSessionId) {
      await this.mergeGuestSession(user.id, guestSessionId);
    }

    return { user, accessToken, refreshToken };
  }

  async refreshAccessToken(oldToken: string) {
    const saved = await this.refreshTokenRepo.findOne({
      where: { token: oldToken },
    });

    if (!saved || saved.revoked || saved.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token reuse or expired');
    }

    return await this.refreshTokenRepo.manager.transaction(async (em) => {
      // 1. 기존 토큰 폐기
      await em.update(RefreshToken, { id: saved.id }, { revoked: true });

      // 2. 새 refresh token 발급
      const newRefreshToken = randomUUID();
      const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 14);

      await em.insert(RefreshToken, {
        userId: saved.userId,
        token: newRefreshToken,
        expiresAt,
      });

      // 3. 새 access token 발급
      const accessToken = this.jwtService.sign(
        { sub: saved.userId },
        { expiresIn: '15m' },
      );

      return { accessToken, refreshToken: newRefreshToken };
    });
  }

  async logout(userId: string) {
    await this.refreshTokenRepo.delete({ userId });
  }

  private async mergeGuestSession(userId: string, guestSessionId: string) {
    // TODO: guestSessionId에 담긴 활동 데이터를 userId에 병합하는 로직 구현
    // 게스트 활동 데이터를 문서에 명시해주세요.
    await this.guestSessionService.invalidate(guestSessionId);
  }
}
