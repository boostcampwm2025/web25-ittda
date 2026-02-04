import {
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
  Res,
  UnauthorizedException,
  // ForbiddenException,
  // NotFoundException,
  Body,
  Headers,
  HttpCode,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from './jwt/jwt.guard';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiNoContentResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
//import { ApiWrappedOkResponse } from '@/common/swagger/api-wrapped-response.decorator';

import type { Request, Response } from 'express';
import type { OAuthUserType } from './auth.type';
import { KakaoAuthGuard } from './guards/kakao-auth.guard';
//import { DevTokenRequestDto } from './dto/dev-token.dto';

interface AuthenticatedRequest extends Request {
  user: { sub: string; email?: string };
  cookies: {
    refreshToken?: string;
    [key: string]: string | undefined;
  };
}

@ApiTags('auth')
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
  @ApiOperation({
    summary: 'Google 로그인',
    description: 'Google OAuth2 로그인 페이지로 리다이렉트합니다.',
  })
  async googleLogin() {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({
    summary: 'Google 로그인 콜백',
    description: 'Google 인증 완료 후 호출되며, FE로 리다이렉트합니다.',
  })
  async googleCallback(
    @Req() req: Request & { user: OAuthUserType },
    @Res() res: Response,
  ) {
    // 1. DB에 유저 생성/조회 + 토큰 발급 (실제 oauthLogin 호출)
    const { accessToken, refreshToken, expiresAt } =
      await this.authService.oauthLogin(req.user);

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
  @UseGuards(KakaoAuthGuard)
  @ApiOperation({
    summary: 'Kakao 로그인',
    description: 'Kakao OAuth2 로그인 페이지로 리다이렉트합니다.',
  })
  async kakaoLogin() {}

  @Get('kakao/callback')
  @UseGuards(KakaoAuthGuard)
  @ApiOperation({
    summary: 'Kakao 로그인 콜백',
    description: 'Kakao 인증 완료 후 호출되며, FE로 리다이렉트합니다.',
  })
  async kakaoCallback(
    @Req() req: Request & { user: OAuthUserType },
    @Res() res: Response,
  ) {
    // Google과 동일한 로직
    const { accessToken, refreshToken, expiresAt } =
      await this.authService.oauthLogin(req.user);

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
  @ApiOperation({
    summary: '인증 코드 교환',
    description:
      'OAuth 콜백에서 받은 코드를 Access Token과 Refresh Token으로 교환합니다. 게스트 세션이 있다면 유저로 병합도 수행합니다.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { code: { type: 'string', description: '인증 코드' } },
      required: ['code'],
    },
  })
  @HttpCode(204)
  @ApiNoContentResponse({
    description: '인증 성공 (토큰은 쿠키 및 헤더에 설정됨)',
  })
  //@ApiWrappedOkResponse({ type: Object })
  async exchangeCode(
    @Body('code') code: string,
    @Res({ passthrough: true }) res: Response,
    @Headers('x-guest-session-id') guestSessionId?: string,
  ) {
    // code 검증 후 저장된 토큰 반환
    const { userId, accessToken, refreshToken } =
      this.authService.exchangeCodeForTokens(code);

    if (guestSessionId) {
      // 게스트 세션 병합
      await this.authService.mergeGuestSession(userId, guestSessionId);
    }

    // HttpOnly 쿠키에 refresh token 저장
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 1000 * 60 * 60 * 24 * 14,
    });

    // 응답 헤더에 Access Token 설정
    res.set('Authorization', `Bearer ${accessToken}`);
    res.set('Access-Control-Expose-Headers', 'Authorization');

    return;
  }

  @Post('refresh')
  @ApiOperation({
    summary: 'Access Token 갱신',
    description:
      'Refresh Token 쿠키를 사용하여 새로운 Access Token을 발급받습니다.',
  })
  @HttpCode(204)
  @ApiNoContentResponse({
    description: '갱신 성공 (새 토큰은 쿠키 및 헤더에 설정됨)',
  })
  async refresh(
    @Req() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const oldToken = req.cookies?.refreshToken;

    if (!oldToken) {
      throw new UnauthorizedException('No refresh token');
    }

    try {
      const { accessToken, refreshToken } =
        await this.authService.refreshAccessToken(oldToken);

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 1000 * 60 * 60 * 24 * 14,
      });

      res.set('Authorization', `Bearer ${accessToken}`);
      res.set('Access-Control-Expose-Headers', 'Authorization');

      return;
    } catch (error) {
      // 재발급 실패시 refreshToken 쿠키 삭제
      res.clearCookie('refreshToken', { path: '/' });
      throw error;
    }
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearerAuth')
  @ApiOperation({
    summary: '로그아웃',
    description: '세션을 종료하고 Refresh Token 쿠키를 삭제합니다.',
  })
  @HttpCode(204)
  @ApiNoContentResponse({ description: '로그아웃 성공' })
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

  // TODO: 운영환경에서는 주석하는 것 추천
  // @Post('dev/token')
  // @ApiOperation({
  //   summary: '개발용 토큰 발급',
  //   description:
  //     '개발 또는 테스트 환경에서 특정 유저의 토큰을 간편하게 발급받습니다.',
  // })
  // @ApiBody({ type: DevTokenRequestDto })
  // @ApiWrappedOkResponse({ type: Object })
  // async issueDevToken(
  //   @Body() dto: DevTokenRequestDto,
  //   @Headers('x-dev-key') devKey?: string,
  // ) {
  //   const nodeEnv = this.configService.get<string>('NODE_ENV');
  //   const allowed =
  //     nodeEnv === 'development' || nodeEnv === 'test' || nodeEnv === 'local';
  //   const configuredKey = this.configService.get<string>('DEV_AUTH_KEY');

  //   if (!allowed || !configuredKey) {
  //     throw new NotFoundException();
  //   }
  //   if (!devKey || devKey !== configuredKey) {
  //     throw new ForbiddenException('Invalid dev key');
  //   }

  //   const provider = dto.provider ?? 'kakao';
  //   const providerId = dto.providerId ?? `dev-${Date.now()}`;
  //   const nickname = dto.nickname ?? `dev-user-${providerId.slice(-6)}`;
  //   const oauthUser: OAuthUserType = {
  //     provider,
  //     providerId,
  //     nickname,
  //     email: dto.email,
  //   };

  //   const { user, accessToken, refreshToken, expiresAt } =
  //     await this.authService.oauthLogin(oauthUser);

  //   return {
  //     userId: user.id,
  //     accessToken,
  //     refreshToken,
  //     expiresAt,
  //   };
  // }
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
