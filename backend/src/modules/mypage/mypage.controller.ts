import {
  Controller,
  Get,
  Patch,
  Delete,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { MyPageService } from './mypage.service';
import { StatsService } from '../stats/stats.service';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { UpdateMeDto, UpdateSettingsDto } from './dto/update-mypage.dto';
import { ApiWrappedOkResponse } from '@/common/swagger/api-wrapped-response.decorator';
import { UserSummaryResponseDto } from './dto/user-summary.response.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

import type { Request } from 'express';
import type { MyJwtPayload } from '../auth/auth.type';

interface RequestWithUser extends Request {
  user: MyJwtPayload;
}

// 마이페이지/설정
@ApiTags('mypage')
@ApiBearerAuth('bearerAuth')
@Controller({
  path: 'me',
  version: '1',
})
export class MyPageController {
  constructor(
    private readonly myPageService: MyPageService,
    private readonly statsService: StatsService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiOperation({
    summary: '내 프로필 및 통계 조회',
    description: '로그인한 사용자의 프로필 정보와 요약 통계를 조회합니다.',
  })
  @ApiWrappedOkResponse({ type: UserSummaryResponseDto })
  async getMyProfile(
    @Req() req: RequestWithUser,
  ): Promise<UserSummaryResponseDto> {
    const userId = req.user.sub;
    const user = await this.myPageService.findOne(userId);
    const stats = await this.statsService.getUserStats(userId);

    return {
      userId: userId,
      user: user,
      stats,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Patch()
  @ApiOperation({
    summary: '프로필 수정',
    description: '닉네임 또는 프로필 이미지를 수정합니다.',
  })
  @ApiWrappedOkResponse({ type: UserSummaryResponseDto })
  async updateProfile(
    @Req() req: RequestWithUser,
    @Body() dto: UpdateMeDto,
  ): Promise<UserSummaryResponseDto> {
    const userId = req.user.sub;
    const user = await this.myPageService.updateProfile(
      userId,
      dto.nickname,
      dto.profileImageUrl,
    );
    const stats = await this.statsService.getUserStats(userId);
    return { userId, user, stats };
  }

  @UseGuards(JwtAuthGuard)
  @Get('settings')
  @ApiOperation({ summary: '설정 정보 조회' })
  @ApiWrappedOkResponse({ type: Object })
  async getMySettings(
    @Req() req: RequestWithUser,
  ): Promise<Record<string, unknown>> {
    const userId = req.user.sub;
    const user = await this.myPageService.findOne(userId);
    return user.settings as Record<string, unknown>;
  }

  @UseGuards(JwtAuthGuard)
  @Patch('settings')
  @ApiOperation({ summary: '설정 정보 수정' })
  @ApiWrappedOkResponse({ type: Object })
  async updateSettings(
    @Req() req: RequestWithUser,
    @Body() dto: UpdateSettingsDto,
  ): Promise<Record<string, unknown>> {
    const userId = req.user.sub;
    const user = await this.myPageService.updateSettings(userId, dto.settings);
    return user.settings as Record<string, unknown>;
  }

  @UseGuards(JwtAuthGuard)
  @Delete()
  @ApiOperation({ summary: '회원 탈퇴' })
  @ApiWrappedOkResponse({ type: Object })
  async withdraw(@Req() req: RequestWithUser): Promise<void> {
    const userId = req.user.sub;
    await this.myPageService.softDeleteUser(userId);
  }
}
