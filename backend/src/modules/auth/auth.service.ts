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

    private readonly guestMigrationService: GuestMigrationService,
  ) {}

  // userId -> CodePayload 저장
  private codeMap = new Map<string, CodePayload>();

  /**
   * 사용자 식별자를 기반으로 Access/Refresh 토큰을 발급한다.
   *
   * @param userId 토큰 발급 대상 사용자 ID
   * @returns accessToken, refreshToken, expiresAt 정보
   */
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
   *
   * @param oauthUser OAuth Provider에서 전달받은 사용자 정보
   * @returns 사용자 정보와 발급된 토큰 묶음
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
   *
   * @param payload 임시 코드에 매핑해둘 토큰 페이로드
   * @returns FE 교환용 일회성 코드
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
   *
   * @param code FE가 전달한 인증 코드
   * @returns 코드에 매핑된 토큰 및 사용자 ID
   * @throws {UnauthorizedException} 코드가 없거나 만료된 경우
   */
  exchangeCodeForTokens(code: string) {
    const payload = this.codeMap.get(code);

    if (!payload) {
      throw new UnauthorizedException('Invalid or expired code');
    }

    // 일회성 보장
    this.codeMap.delete(code);

    return {
      userId: payload.userId,
      accessToken: payload.accessToken,
      refreshToken: payload.refreshToken,
      expiresAt: payload.expiresAt,
    };
  }

  /**
   * Refresh Token 유효성을 검증한 뒤 Access Token을 재발급한다.
   *
   * @param oldToken 클라이언트가 보낸 기존 Refresh Token
   * @returns 신규 Access Token과 Refresh Token
   * @throws {UnauthorizedException} 토큰 만료/재사용 등 비정상 상태인 경우
   */
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
   *
   * @param userId 토큰 재발급 대상 사용자 ID
   * @param oldTokenId 폐기할 기존 Refresh Token PK
   * @returns 트랜잭션 내에서 발급된 신규 토큰 쌍
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

  /**
   * 사용자 로그아웃 처리로 Refresh Token을 제거한다.
   *
   * @param userId 로그아웃 대상 사용자 ID
   * @throws {NotFoundException} 사용자 정보가 존재하지 않는 경우
   * @throws {UnauthorizedException} 이미 로그아웃되어 토큰이 없는 경우
   */
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

  /**
   * 게스트 세션 데이터를 로그인 사용자 계정으로 병합한다.
   *
   * @param userId 병합 대상 사용자 ID
   * @param guestSessionId 병합할 게스트 세션 식별자
   */
  async mergeGuestSession(userId: string, guestSessionId: string) {
    await this.guestMigrationService.migrate(guestSessionId, userId);
  }
}
