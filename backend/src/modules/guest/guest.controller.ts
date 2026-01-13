import { Controller, Post } from '@nestjs/common';
import { GuestSessionService } from './guest-session.service';

@Controller({
  path: 'auth',
  version: '1',
})
export class GuestAuthController {
  constructor(private readonly guestSessionService: GuestSessionService) {}

  @Post('guest')
  async startGuest() {
    // 로그인 이전 활동을 위한 게스트 세션 발급
    const session = await this.guestSessionService.create();
    // TODO: 차후 Redis 등에 세션 저장 가능

    return {
      guest: true,
      guestSessionId: session.id,
      expiresAt: session.expiresAt,
    };
  }
}
