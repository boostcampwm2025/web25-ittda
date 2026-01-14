import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { randomUUID } from 'crypto';
import { GuestSessionService } from '../guest/guest-session.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RefreshToken } from './refresh_token/refresh_token.entity';

import type { OAuthUserType } from './auth.type';

// 임시 code에 저장할 데이터 타입
interface CodePayload {
  userId: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepo: Repository<RefreshToken>,
    private readonly guestSessionService: GuestSessionService,
  ) {}

  // userId -> CodePayload 저장
  private codeMap = new Map<string, CodePayload>();

  private generateTokens(userId: string) {
    const accessToken = this.jwtService.sign(
      { sub: userId },
      { expiresIn: '15m' },
    );
    const refreshToken = randomUUID();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 14);
    return { accessToken, refreshToken, expiresAt };
  }

  /**
   * OAuth 로그인 처리: DB에 유저 생성/조회 + 토큰 발급
   */
  async oauthLogin(oauthUser: OAuthUserType, guestSessionId?: string) {
    // 1. DB에서 유저 찾거나 생성
    const user = await this.userService.findOrCreateOAuthUser(oauthUser);

    // 2. 토큰 생성
    const { accessToken, refreshToken, expiresAt } = this.generateTokens(
      user.id,
    );

    // 3. DB에 refresh token 저장
    await this.refreshTokenRepo.save({
      userId: user.id,
      token: refreshToken,
      expiresAt,
    });

    // 4. 게스트 세션 병합 (있다면)
    if (guestSessionId) {
      await this.mergeGuestSession(user.id, guestSessionId);
    }

    return { user, accessToken, refreshToken, expiresAt };
  }

  /**
   * 임시 code 생성 (토큰 정보를 담아서)
   */
  createTemporaryCode(payload: CodePayload): string {
    const code = randomUUID();
    this.codeMap.set(code, payload);

    // 5분 후 자동 삭제
    setTimeout(() => this.codeMap.delete(code), 1000 * 60 * 5);

    return code;
  }

  /**
   * code를 검증하고 저장된 토큰 반환
   */
  exchangeCodeForTokens(code: string) {
    const payload = this.codeMap.get(code);

    if (!payload) {
      throw new UnauthorizedException('Invalid or expired code');
    }

    // 일회성 보장
    this.codeMap.delete(code);

    return {
      accessToken: payload.accessToken,
      refreshToken: payload.refreshToken,
      expiresAt: payload.expiresAt,
    };
  }

  async refreshAccessToken(oldToken: string) {
    const saved = await this.refreshTokenRepo.findOne({
      where: { token: oldToken },
    });

    if (!saved || saved.revoked || saved.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token reuse or expired');
    }

    return await this.refreshTokenRepo.manager.transaction(async (em) => {
      // 기존 토큰 폐기
      await em.update(RefreshToken, { id: saved.id }, { revoked: true });

      // 새 토큰 생성
      const { accessToken, refreshToken, expiresAt } = this.generateTokens(
        saved.userId,
      );

      // DB에 새 refresh token 저장
      await em.insert(RefreshToken, {
        userId: saved.userId,
        token: refreshToken,
        expiresAt,
      });

      return { accessToken, refreshToken };
    });
  }

  async logout(userId: string) {
    await this.refreshTokenRepo.delete({ userId });
  }

  private async mergeGuestSession(userId: string, guestSessionId: string) {
    // TODO: guestSessionId에 담긴 활동 데이터를 userId에 병합하는 로직 구현
    await this.guestSessionService.invalidate(guestSessionId);
  }
}
