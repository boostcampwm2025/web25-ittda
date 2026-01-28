import { Controller, Post } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { GuestSessionService } from './guest-session.service';
import { ApiWrappedOkResponse } from '@/common/swagger/api-wrapped-response.decorator';

@ApiTags('auth')
@Controller({
  path: 'auth',
  version: '1',
})
export class GuestController {
  constructor(private readonly guestSessionService: GuestSessionService) {}

  @Post('guest')
  @ApiOperation({
    summary: '게스트 세션 발급',
    description: '로그인하지 않은 사용자를 위한 임시 세션을 발급합니다.',
  })
  @ApiWrappedOkResponse({ type: Object })
  async startGuest() {
    // 로그인 이전 활동을 위한 게스트 세션 발급
    const session = await this.guestSessionService.create();

    return {
      guest: true,
      guestSessionId: session.id,
      expiresAt: session.expiresAt,
    };
  }
}
// 차후 Redis 등에 세션 저장 고려 가능
