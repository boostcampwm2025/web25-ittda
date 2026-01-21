import {
  Controller,
  Get,
  Patch,
  Delete,
  Body,
  UseGuards,
  Req,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { MyPageService } from './mypage.service';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { UpdateMeDto, UpdateSettingsDto } from './dto/update-mypage.dto';
import { ApiWrappedOkResponse } from '@/common/swagger/api-wrapped-response.decorator';
import { GetEmotionSummaryQueryDto } from './dto/get-emotion-summary.query.dto';
import { EmotionSummaryResponseDto } from './dto/emotion-summary.response.dto';
import { GetStatsSummaryQueryDto } from './dto/get-stats-summary.query.dto';
import { StatsSummaryResponseDto } from './dto/stats-summary.response.dto';
import { GetTagStatsQueryDto } from './dto/get-tag-stats.query.dto';
import { TagStatsResponseDto } from './dto/tag-stats.response.dto';

import type { Request } from 'express';
import type { MyJwtPayload } from '../auth/auth.type';
import type { User } from '../user/entity/user.entity';
import type { TagCount, EmotionCount, UserStats } from './mypage.interface';

interface RequestWithUser extends Request {
  user: MyJwtPayload;
}

// 마이페이지/설정
@Controller({
  path: 'me',
  version: '1',
})
export class MyPageController {
  constructor(private readonly myPageService: MyPageService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async getMyProfile(
    @Req() req: RequestWithUser,
  ): Promise<User & { stats: UserStats }> {
    const userId = req.user.sub;
    const user = await this.myPageService.findOne(userId);
    const stats = await this.myPageService.getUserStats(userId);

    return {
      ...user,
      stats,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Patch()
  updateProfile(
    @Req() req: RequestWithUser,
    @Body() dto: UpdateMeDto,
  ): Promise<User> {
    const userId = req.user.sub;
    return this.myPageService.updateProfile(
      userId,
      dto.nickname,
      dto.profileImageUrl,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('settings')
  async getMySettings(
    @Req() req: RequestWithUser,
  ): Promise<Record<string, unknown>> {
    const userId = req.user.sub;
    const user = await this.myPageService.findOne(userId);
    return user.settings as Record<string, unknown>;
  }

  @UseGuards(JwtAuthGuard)
  @Patch('settings')
  async updateSettings(
    @Req() req: RequestWithUser,
    @Body() dto: UpdateSettingsDto,
  ): Promise<User> {
    const userId = req.user.sub;
    return this.myPageService.updateSettings(userId, dto.settings);
  }

  @UseGuards(JwtAuthGuard)
  @Get('tags')
  async getMyTags(
    @Req() req: RequestWithUser,
    @Query('sort') sort: 'recent' | 'frequent' = 'recent',
  ): Promise<TagCount[]> {
    const userId = req.user.sub;
    return this.myPageService.getTags(userId, sort);
  }

  @UseGuards(JwtAuthGuard)
  @Get('emotions')
  async getMyEmotions(
    @Req() req: RequestWithUser,
    @Query('sort') sort: 'recent' | 'frequent' = 'recent',
  ): Promise<EmotionCount[] | string[]> {
    const userId = req.user.sub;
    return this.myPageService.getEmotions(userId, sort);
  }

  @UseGuards(JwtAuthGuard)
  @Get('emotions/summary')
  @ApiWrappedOkResponse({ type: EmotionSummaryResponseDto, isArray: true })
  async getEmotionSummary(
    @Req() req: RequestWithUser,
    @Query() query: GetEmotionSummaryQueryDto,
  ): Promise<{ emotion: string; count: number }[]> {
    const userId = req.user.sub;
    const { year, month } = this.parseYearMonth(query.month);

    return this.myPageService.getEmotionSummary(userId, year, month);
  }

  @UseGuards(JwtAuthGuard)
  @Get('stats/summary')
  @ApiWrappedOkResponse({ type: StatsSummaryResponseDto })
  async getStatsSummary(
    @Req() req: RequestWithUser,
    @Query() query: GetStatsSummaryQueryDto,
  ): Promise<{ count: number }> {
    const userId = req.user.sub;
    return this.myPageService.getStatsSummary(userId, query);
  }

  @UseGuards(JwtAuthGuard)
  @Get('tags/stats')
  @ApiWrappedOkResponse({ type: TagStatsResponseDto })
  async getTagStats(
    @Req() req: RequestWithUser,
    @Query() query: GetTagStatsQueryDto,
  ): Promise<TagStatsResponseDto> {
    const userId = req.user.sub;
    const limit = query.limit ?? 10;

    const [recentTop, allTimeTop] = await Promise.all([
      this.myPageService.getTags(userId, 'recent', limit),
      this.myPageService.getTags(userId, 'frequent', limit),
    ]);

    return {
      recentTop: recentTop, // 최근 TOP
      allTimeTop: allTimeTop, // 누적 TOP
    };
  }

  @UseGuards(JwtAuthGuard)
  @Delete()
  async withdraw(@Req() req: RequestWithUser): Promise<void> {
    const userId = req.user.sub;
    await this.myPageService.softDeleteUser(userId);
  }

  private parseYearMonth(yyyy_mm: string) {
    const [yearStr, monthStr] = yyyy_mm.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);

    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      throw new BadRequestException('Invalid date format. Use YYYY-MM.');
    }

    return { year, month };
  }
}
