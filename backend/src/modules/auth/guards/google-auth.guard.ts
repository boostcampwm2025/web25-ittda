/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  getAuthenticateOptions(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const prompt = request.query.prompt;

    return {
      scope: ['email', 'profile'],
      ...(prompt && {
        prompt,
        accessType: 'offline', // Google에서 refresh token을 받기 위해 필요할 수 있음
      }),
    };
  }
}
