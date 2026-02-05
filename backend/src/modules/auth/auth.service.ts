import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { randomUUID } from 'crypto';
import { GuestMigrationService } from '../guest/guest-migration.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RefreshToken } from './refresh_token/refresh_token.entity';
import { RedisService } from '@liaoliaots/nestjs-redis';
import type { Redis } from 'ioredis';

import type { OAuthUserType } from './auth.type';

// 임시 code에 저장할 데이터 타입
interface CodePayload {
  userId: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date; // JSON.stringified -> string in Redis
}

@Injectable()
export class AuthService {
  private static readonly CODE_TTL_SEC = 300; // 5 minutes
  private static readonly CODE_PREFIX = 'auth_code:';

  private readonly redis: Redis;

  constructor(
    private readonly userService: UserService,

    private readonly jwtService: JwtService,

    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepo: Repository<RefreshToken>,

    private readonly guestMigrationService: GuestMigrationService,

    private readonly redisService: RedisService,
  ) {
    this.redis = this.redisService.getOrThrow();
  }

  // Legacy in-memory codeMap refactoring note:
  // - codeMap -> Redis SETEX "auth_code:{code}"

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
  async oauthLogin(oauthUser: OAuthUserType) {
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

    return { user, accessToken, refreshToken, expiresAt };
  }

  /**
   * 임시 code 생성 (토큰 정보를 담아서)
   */
  async createTemporaryCode(payload: CodePayload): Promise<string> {
    const code = randomUUID();

    const key = `${AuthService.CODE_PREFIX}${code}`;
    await this.redis.set(
      key,
      JSON.stringify(payload),
      'EX',
      AuthService.CODE_TTL_SEC,
    );

    return code;
  }

  /**
   * code를 검증하고 저장된 토큰 반환
   */
  async exchangeCodeForTokens(code: string) {
    const key = `${AuthService.CODE_PREFIX}${code}`;
    const val = await this.redis.get(key);

    if (!val) {
      throw new UnauthorizedException('Invalid or expired code');
    }

    // 일회성 보장
    await this.redis.del(key);

    const payload = JSON.parse(val) as CodePayload;
    // JSON restoration of Date string
    const expiresAt = new Date(payload.expiresAt);

    return {
      userId: payload.userId,
      accessToken: payload.accessToken,
      refreshToken: payload.refreshToken,
      expiresAt: expiresAt,
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
      const gracePeriod = 20 * 1000; // 네트워크 지연 고려

      // saved.updatedAt이 Date 객체인지 확인하고 밀리초 단위로 비교
      const revokedAt = new Date(saved.updatedAt).getTime();
      const diff = now.getTime() - revokedAt;

      if (diff < gracePeriod) {
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

  async mergeGuestSession(userId: string, guestSessionId: string) {
    await this.guestMigrationService.migrate(guestSessionId, userId);
  }
}
