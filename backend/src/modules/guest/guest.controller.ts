import { Controller, Post } from '@nestjs/common';
import { GuestSessionService } from './guest-session.service';

@Controller({
  path: 'auth',
  version: '1',
})
export class GuestController {
  constructor(private readonly guestSessionService: GuestSessionService) {}

  @Post('guest')
  async startGuest() {
    // 로그인 이전 활동을 위한 게스트 세션 발급
    const session = await this.guestSessionService.create();

    return {
      success: true,
      data: {
        guest: true,
        guestSessionId: session.id,
        expiresAt: session.expiresAt,
      },
      error: null,
    };
  }
}
// 차후 Redis 등에 세션 저장 고려 가능
