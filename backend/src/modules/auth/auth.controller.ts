import {
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from './jwt/jwt.guard';

import type { Request, Response } from 'express';
import type { OAuthUserType } from './auth.type';

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
}) // /v1/auth/~
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
  ) {
    const guestSessionId = req.headers['x-guest-session-id'] as
      | string
      | undefined;

    const { accessToken: accessToken, refreshToken: refreshToken } =
      await this.authService.oauthLogin(req.user, guestSessionId);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/', // TODO: 추후 변경
      maxAge: 1000 * 60 * 60 * 24 * 14,
    });

    const redirectUrl = `${this.FRONTEND_URL}/oauth/callback?accessToken=${accessToken}`;
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
  ) {
    const guestSessionId = req.headers['x-guest-session-id'] as
      | string
      | undefined;

    const { accessToken: accessToken, refreshToken: refreshToken } =
      await this.authService.oauthLogin(req.user, guestSessionId);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/', // TODO: 추후 변경
      maxAge: 1000 * 60 * 60 * 24 * 14,
    });

    const redirectUrl = `${this.FRONTEND_URL}/oauth/callback?accessToken=${accessToken}`;
    return res.redirect(302, redirectUrl);
  }

  @Post('refresh')
  async refresh(@Req() req: AuthenticatedRequest, @Res() res: Response) {
    // refresh token rotation 구현 (acess token 만료로 401시 FE에서 호출)
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

    return res.json({ accessToken });
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@Req() req: AuthenticatedRequest, @Res() res: Response) {
    await this.authService.logout(req.user.sub);

    res.clearCookie('refreshToken', {
      path: '/',
    });

    res.status(200).send({
      success: true,
      error: null,
    });
  }
}
/*
FE 처리: 프론트엔드에서는 jwt-decode와 같은 라이브러리를 사용하여 
다음과 같이 user.id를 얻을 수 있습니다.

import { jwtDecode } from 'jwt-decode';
const decoded = jwtDecode(accessToken);
console.log(decoded.sub); // user.id 출력

이 정보를 이용해 로그아웃 요청 시 req.user.sub 전달 가능
@UseGuards(JwtAuthGuard)는 Authorization: Bearer <accessToken> 헤더를 담아 요청해야 함
*/
