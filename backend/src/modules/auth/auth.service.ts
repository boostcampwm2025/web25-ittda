import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { randomUUID } from 'crypto';
import { GuestSessionService } from '../guest/guest-session.service';
import { GuestMigrationService } from '../guest/guest-migration.service';
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
    private readonly guestMigrationService: GuestMigrationService,
  ) {}

  // userId -> CodePayload 저장
  private codeMap = new Map<string, CodePayload>();

  private generateTokens(userId: string) {
    const accessToken = this.jwtService.sign(
      { sub: userId },
      { expiresIn: '15m' },
    );
    const refreshToken = randomUUID(); // TODO: 메모리 -> redis 등 영속성 고려
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

    if (!saved || saved.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token reuse or expired');
    }

    // 2. 이미 폐기(revoked)된 토큰인 경우 Grace Period 체크
    if (saved.revoked) {
      const now = new Date();
      const gracePeriod = 10 * 1000; // 10초 유예
      const revokedAt = new Date((saved as { updatedAt: Date }).updatedAt);
      const isWithinGracePeriod =
        now.getTime() - revokedAt.getTime() < gracePeriod;

      if (isWithinGracePeriod) {
        // 유예 기간 내: 가장 최근 발급된 토큰을 찾아 반환
        const latestToken = await this.refreshTokenRepo.findOne({
          where: { userId: saved.userId, revoked: false },
          order: { createdAt: 'DESC' },
        });

        if (latestToken) {
          const accessToken = this.jwtService.sign(
            { sub: saved.userId },
            { expiresIn: '15m' },
          );
          return { accessToken, refreshToken: latestToken.token };
        }
      }

      throw new UnauthorizedException('Refresh token reuse detected');
    }

    // 정상적인 첫 번째 갱신 요청 처리
    return await this.issueNewTokens(saved.userId, saved.id);
  }

  /**
   * 토큰 갱신 및 폐기 로직을 별도 메서드로 분리 (트랜잭션 포함)
   */
  private async issueNewTokens(userId: string, oldTokenId: string) {
    return await this.refreshTokenRepo.manager.transaction(async (em) => {
      // 기존 토큰 폐기 (Grace Period를 위해 updatedAt이 갱신됨)
      await em.update(RefreshToken, { id: oldTokenId }, { revoked: true });

      // 새 토큰 생성
      const { accessToken, refreshToken, expiresAt } =
        this.generateTokens(userId);

      // DB에 새 refresh token 저장
      await em.insert(RefreshToken, {
        userId,
        token: refreshToken,
        expiresAt,
      });

      return { accessToken, refreshToken };
    });
  }

  async logout(userId: string) {
    // 1. 유저 존재 여부 확인 (UserService 활용)
    const user = await this.userService.findById(userId); // userService에 findById 구현 가정
    if (!user) {
      throw new NotFoundException('해당 사용자를 찾을 수 없습니다.');
    }

    // 2. 해당 유저의 Refresh Token 존재 여부 확인
    const refreshToken = await this.refreshTokenRepo.findOne({
      where: { userId },
    });

    // 3. 이미 로그아웃된 상태 (토큰이 없음) 처리
    if (!refreshToken) {
      throw new UnauthorizedException(
        '이미 로그아웃되었거나 유효하지 않은 세션입니다.',
      );
    }

    // 4. 정상 삭제 처리
    await this.refreshTokenRepo.delete({ userId });
  }

  private async mergeGuestSession(userId: string, guestSessionId: string) {
    await this.guestMigrationService.migrate(guestSessionId, userId);
  }
}
