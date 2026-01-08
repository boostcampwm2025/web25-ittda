import { Controller, Get, Req, UseGuards, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';

import type { Request, Response } from 'express';
import type { OAuthUserType } from './auth.type';

@Controller({
  path: 'auth',
  version: '1',
}) // /api/v1/auth/~
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
    const result = await this.authService.oauthLogin(req.user);
    res.cookie('accessToken', result.accessToken, {
      httpOnly: true, // JavaScript에서 접근 불가 (XSS 방지)
      secure: this.configService.get<string>('NODE_ENV') === 'production', // HTTPS에서만 전송
      sameSite: 'lax', // Cross-site 요청 제한 (CSRF 방어)
      //domain: this.configService.get<string>('COOKIE_DOMAIN'), // .domain.com 등으로 설정 시 서브도메인 간 공유 가능
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7일
    });
    res.redirect(`${this.FRONTEND_URL}/oauth/callback`);
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
    const result = await this.authService.oauthLogin(req.user);
    // HttpOnly 쿠키 설정 (res.cookie 사용)
    res.cookie('accessToken', result.accessToken, {
      httpOnly: true, // JavaScript에서 접근 불가 (XSS 방지)
      secure: this.configService.get<string>('NODE_ENV') === 'production', // HTTPS에서만 전송
      sameSite: 'lax', // Cross-site 요청 제한 (CSRF 방어)
      //domain: this.configService.get<string>('COOKIE_DOMAIN'), // .domain.com 등으로 설정 시 서브도메인 간 공유 가능
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7일
    });
    res.redirect(`${this.FRONTEND_URL}/oauth/callback`);
  }
}
