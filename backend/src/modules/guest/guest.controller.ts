import { Controller, Post, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { GuestSessionService } from './guest-session.service';
import { ApiWrappedOkResponse } from '@/common/swagger/api-wrapped-response.decorator';
import { JwtService } from '@nestjs/jwt';
import { GuestResponseDto } from './dto/guest.response.dto';

import type { Response } from 'express';

@ApiTags('auth')
@Controller({
  path: 'auth',
  version: '1',
})
export class GuestController {
  constructor(
    private readonly guestSessionService: GuestSessionService,
    private readonly jwtService: JwtService,
  ) {}

  @Post('guest')
  @ApiOperation({
    summary: '게스트 세션 발급',
    description:
      '로그인하지 않은 사용자를 위한 임시 세션을 발급합니다. 응답 헤더의 Authorization에 Access Token이 담겨 반환됩니다.',
  })
  @ApiHeader({
    name: 'Authorization',
    description: 'Bearer {accessToken}',
  })
  @ApiWrappedOkResponse({ type: GuestResponseDto })
  async startGuest(
    @Res({ passthrough: true }) res: Response,
  ): Promise<GuestResponseDto> {
    // 로그인 이전 활동을 위한 게스트 세션 발급
    const session = await this.guestSessionService.create();

    const accessToken = this.jwtService.sign(
      { sub: session.userId },
      { expiresIn: '3d' }, // 게스트 세션 만료기간과 동일: 3일
    );

    // 응답 헤더에 guest를 위한 Access Token 설정
    res.set('Authorization', `Bearer ${accessToken}`);
    res.set('Access-Control-Expose-Headers', 'Authorization');

    return {
      guest: true,
      guestSessionId: session.id,
      expiresAt: session.expiresAt,
    };
  }
}
// 차후 Redis 등에 세션 저장 고려 가능
