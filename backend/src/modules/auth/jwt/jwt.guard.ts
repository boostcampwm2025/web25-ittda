import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err, user, info) {
    // 토큰이 없거나(info), 에러가 나도 Exception을 던지지 않고 null 반환
    if (err || !user) {
      console.error('JWT Auth Guard Error:', err, info);
      return null;
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return user;
  }
}
