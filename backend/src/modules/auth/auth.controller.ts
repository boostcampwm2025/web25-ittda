import {
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
  Res,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  Body,
  Headers,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from './jwt/jwt.guard';

import type { Request, Response } from 'express';
import type { OAuthUserType } from './auth.type';
import { DevTokenRequestDto } from './dto/dev-token.dto';

interface AuthenticatedRequest extends Request {
  user: { sub: string; email?: string };
  cookies: {
    refreshToken?: string;
    [key: string]: string | undefined;
  };
}

@Controller({
  path: 'auth',
  version: '1',
})
export class AuthController {
  private FRONTEND_URL: string;

  constructor(
    private readonly authService: AuthService,
    private configService: ConfigService,
  ) {
    this.FRONTEND_URL = this.configService.get<string>('FRONTEND_URL')!;
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleLogin() {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(
    @Req() req: Request & { user: OAuthUserType },
    @Res() res: Response,
    @Headers('x-guest-session-id') guestSessionId?: string,
  ) {
    // 1. DB에 유저 생성/조회 + 토큰 발급 (실제 oauthLogin 호출)
    const { accessToken, refreshToken, expiresAt } =
      await this.authService.oauthLogin(req.user, guestSessionId);

    // 2. 토큰 정보를 담은 임시 code 생성
    const code = this.authService.createTemporaryCode({
      userId: req.user.provider + '_' + req.user.providerId, // 실제론 user.id 사용
      accessToken,
      refreshToken,
      expiresAt,
    });

    // 3. FE로 리다이렉트
    const redirectUrl = `${this.FRONTEND_URL}/oauth/callback?code=${code}`;
    return res.redirect(302, redirectUrl);
  }

  @Get('kakao')
  @UseGuards(AuthGuard('kakao'))
  async kakaoLogin() {}

  @Get('kakao/callback')
  @UseGuards(AuthGuard('kakao'))
  async kakaoCallback(
    @Req() req: Request & { user: OAuthUserType },
    @Res() res: Response,
    @Headers('x-guest-session-id') guestSessionId?: string,
  ) {
    // Google과 동일한 로직
    const { accessToken, refreshToken, expiresAt } =
      await this.authService.oauthLogin(req.user, guestSessionId);

    const code = this.authService.createTemporaryCode({
      userId: req.user.provider + '_' + req.user.providerId,
      accessToken,
      refreshToken,
      expiresAt,
    });

    const redirectUrl = `${this.FRONTEND_URL}/oauth/callback?code=${code}`;
    return res.redirect(302, redirectUrl);
  }

  @Post('exchange')
  exchangeCode(
    @Body('code') code: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    // code 검증 후 저장된 토큰 반환
    const { accessToken, refreshToken } =
      this.authService.exchangeCodeForTokens(code);

    // HttpOnly 쿠키에 refresh token 저장
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 1000 * 60 * 60 * 24 * 14,
    });

    // 응답 헤더에 Access Token 설정
    // 표준적인 방법은 Authorization 헤더에 Bearer 스키마를 사용하는 것입니다.
    res.set('Authorization', `Bearer ${accessToken}`);

    // 만약 클라이언트(브라우저)에서 이 헤더에 접근해야 한다면 Access-Control-Expose-Headers 설정이 필요할 수 있습니다.
    res.set('Access-Control-Expose-Headers', 'Authorization');

    // Body는 비워서 보냅니다.
    return;
  }

  @Post('refresh')
  async refresh(
    @Req() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const oldToken = req.cookies?.refreshToken;

    if (!oldToken) {
      throw new UnauthorizedException('No refresh token');
    }

    const { accessToken, refreshToken } =
      await this.authService.refreshAccessToken(oldToken);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 1000 * 60 * 60 * 24 * 14,
    });

    // 응답 헤더에 Access Token 설정
    // 표준적인 방법은 Authorization 헤더에 Bearer 스키마를 사용하는 것입니다.
    res.set('Authorization', `Bearer ${accessToken}`);

    // 만약 클라이언트(브라우저)에서 이 헤더에 접근해야 한다면 Access-Control-Expose-Headers 설정이 필요할 수 있습니다.
    res.set('Access-Control-Expose-Headers', 'Authorization');

    // Body는 비워서 보냅니다.
    return;
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(
    @Req() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logout(req.user.sub);

    res.clearCookie('refreshToken', {
      path: '/',
    });

    return;
  }

  @Post('dev/token')
  async issueDevToken(
    @Body() dto: DevTokenRequestDto,
    @Headers('x-dev-key') devKey?: string,
  ) {
    const nodeEnv = this.configService.get<string>('NODE_ENV');
    const allowed =
      nodeEnv === 'development' || nodeEnv === 'test' || nodeEnv === 'local';
    const configuredKey = this.configService.get<string>('DEV_AUTH_KEY');

    if (!allowed || !configuredKey) {
      throw new NotFoundException();
    }
    if (!devKey || devKey !== configuredKey) {
      throw new ForbiddenException('Invalid dev key');
    }

    const provider = dto.provider ?? 'kakao';
    const providerId = dto.providerId ?? `dev-${Date.now()}`;
    const nickname = dto.nickname ?? `dev-user-${providerId.slice(-6)}`;
    const oauthUser: OAuthUserType = {
      provider,
      providerId,
      nickname,
      email: dto.email,
    };

    const { user, accessToken, refreshToken, expiresAt } =
      await this.authService.oauthLogin(oauthUser);

    return {
      userId: user.id,
      accessToken,
      refreshToken,
      expiresAt,
    };
  }
}

/*
## 실행 흐름 정리

사용자 클릭: "Google 로그인"
   ↓
1. GET /v1/auth/google
   ↓
2. Google OAuth 페이지로 리다이렉트
   ↓
3. 사용자 인증 완료
   ↓
4. GET /v1/auth/google/callback
   - Guard가 req.user에 OAuth 정보 주입
   - authService.oauthLogin() 호출
     → findOrCreateOAuthUser() 실행 (DB 조회/생성)
     → mergeGuestSession() 실행 (헤더에 x-guest-session-id 있으면)
     → 토큰 생성 및 DB 저장
   - 임시 code 생성 (토큰 정보 포함)
   - FE로 리다이렉트 (code 포함)
   ↓
5. FE가 POST /v1/auth/exchange 호출 (code 전달)
   - code 검증 및 토큰 반환
   - refresh token을 HttpOnly 쿠키에 저장
   - access token을 응답 본문에 반환
*/
