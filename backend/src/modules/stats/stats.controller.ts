import {
  Controller,
  Get,
  Query,
  Req,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { DateTime } from 'luxon';

import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { ApiWrappedOkResponse } from '@/common/swagger/api-wrapped-response.decorator';
import { StatsService } from './stats.service';
import { GetEmotionSummaryQueryDto } from './dto/get-emotion-summary.query.dto';
import { GetEmotionStatsQueryDto } from './dto/get-emotion-stats.query.dto';
import { EmotionSummaryResponseDto } from './dto/emotion-summary.response.dto';
import { StatsSummaryResponseDto } from './dto/stats-summary.response.dto';
import { GetTagStatsQueryDto } from './dto/get-tag-stats.query.dto';
import { TagStatsResponseDto } from './dto/tag-stats.response.dto';

import type { Request } from 'express';
import type { MyJwtPayload } from '../auth/auth.type';
import type { EmotionCount } from './stats.interface';

interface RequestWithUser extends Request {
  user: MyJwtPayload;
}

@ApiTags('stats')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({
  path: 'stats',
  version: '1',
})
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('tags')
  @ApiOperation({ summary: '태그 통계' })
  @ApiWrappedOkResponse({ type: TagStatsResponseDto })
  async getTagStats(
    @Req() req: RequestWithUser,
    @Query() query: GetTagStatsQueryDto,
  ): Promise<TagStatsResponseDto> {
    const userId = req.user.sub;
    const limit = query.limit;

    const [recentTags, frequentTags] = await Promise.all([
      this.statsService.getTags(userId, 'recent', limit),
      this.statsService.getTags(userId, 'frequent', limit),
    ]);

    return {
      recentTags,
      frequentTags,
    };
  }

  @Get('emotions')
  @ApiOperation({ summary: '감정 사용 통계 조회' })
  @ApiQuery({ name: 'sort', enum: ['recent', 'frequent'], required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiWrappedOkResponse({ type: String, isArray: true })
  async getMyEmotions(
    @Req() req: RequestWithUser,
    @Query() query: GetEmotionStatsQueryDto,
  ): Promise<{ data: EmotionCount[]; meta: { totalCount: number } }> {
    const userId = req.user.sub;
    const sort = query.sort ?? 'frequent';
    const { items, totalCount } = await this.statsService.getEmotionStats(
      userId,
      sort,
      query.limit,
    );
    return {
      data: items,
      meta: { totalCount },
    };
  }

  @Get('emotions/summary')
  @ApiOperation({ summary: '월별 감정 요약' })
  @ApiWrappedOkResponse({ type: EmotionSummaryResponseDto, isArray: true })
  async getEmotionSummary(
    @Req() req: RequestWithUser,
    @Query() query: GetEmotionSummaryQueryDto,
  ): Promise<{ emotion: string; count: number }[]> {
    const userId = req.user.sub;
    const { year, month } = this.parseYearMonth(query.month);

    return this.statsService.getEmotionSummary(userId, year, month);
  }

  @Get('summary')
  @ApiOperation({ summary: '유저 기록 요약' })
  @ApiWrappedOkResponse({ type: StatsSummaryResponseDto })
  async getStatsSummary(@Req() req: RequestWithUser): Promise<{
    streak: number;
    monthlyRecordingDays: number;
  }> {
    const userId = req.user.sub;
    const now = DateTime.now().setZone('Asia/Seoul');
    const [streak, monthlyRecordingDays] = await Promise.all([
      this.statsService.getStreak(userId),
      this.statsService.getMonthlyRecordingDays(userId, now.year, now.month),
    ]);

    return { streak, monthlyRecordingDays };
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
