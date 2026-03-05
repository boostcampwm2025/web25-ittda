/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  getAuthenticateOptions(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const prompt = request.query.prompt;
    const mobile = request.query.mobile;

    if (mobile === 'true') {
      response.cookie('oauth_mobile', '1', {
        maxAge: 5 * 60 * 1000,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      });
    }

    return {
      scope: ['email', 'profile'],
      ...(prompt && {
        prompt,
        accessType: 'offline', // Google에서 refresh token을 받기 위해 필요할 수 있음
      }),
    };
  }
}
