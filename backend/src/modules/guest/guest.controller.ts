import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { GuestSessionService } from './guest-session.service';
import { ApiWrappedOkResponse } from '@/common/swagger/api-wrapped-response.decorator';
import { JwtService } from '@nestjs/jwt';
import { GuestResponseDto } from './dto/guest.response.dto';
import { RestoreGuestRequestDto } from './dto/guest.restore.dto';

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

  @Post('guest/restore')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '게스트 세션 복원',
    description:
      '유효한 게스트 세션 ID가 있는 경우 해당 세션을 재활용합니다. 세션이 없거나 만료된 경우 401을 반환합니다.',
  })
  @ApiHeader({
    name: 'Authorization',
    description: 'Bearer {accessToken}',
  })
  @ApiWrappedOkResponse({ type: GuestResponseDto })
  async restoreGuest(
    @Body() body: RestoreGuestRequestDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<GuestResponseDto> {
    const session = await this.guestSessionService.restore(body.sessionId);
    if (!session) {
      throw new UnauthorizedException(
        '유효하지 않거나 만료된 게스트 세션입니다.',
      );
    }

    const accessToken = this.jwtService.sign(
      { sub: session.userId },
      { expiresIn: '3d' },
    );

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
