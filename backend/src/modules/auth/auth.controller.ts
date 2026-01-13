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

    const { user, accessToken, refreshToken } =
      await this.authService.oauthLogin(req.user, guestSessionId);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/', // TODO: 추후 변경
      maxAge: 1000 * 60 * 60 * 24 * 14,
    });

    res.json({ user, accessToken });
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

    const { user, accessToken, refreshToken } =
      await this.authService.oauthLogin(req.user, guestSessionId);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/', // TODO: 추후 변경
      maxAge: 1000 * 60 * 60 * 24 * 14,
    });

    res.json({ user, accessToken });
  }

  @Post('refresh')
  async refresh(@Req() req: AuthenticatedRequest) {
    const token = req.cookies?.refreshToken;
    if (!token) {
      throw new UnauthorizedException('No refresh token found');
    }

    return this.authService.refreshAccessToken(token);
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
