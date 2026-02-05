import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
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
import { GetEmotionStatsQueryDto } from './dto/get-emotion-stats.query.dto';
import { EmotionSummaryResponseDto } from './dto/emotion-summary.response.dto';
import { StatsSummaryResponseDto } from './dto/stats-summary.response.dto';
import { GetTagStatsQueryDto } from './dto/get-tag-stats.query.dto';
import { TagStatsResponseDto } from './dto/tag-stats.response.dto';
import { ApiEmotionStatsOkResponse } from './stats.swagger';

import type { Request } from 'express';
import type { MyJwtPayload } from '../auth/auth.type';

interface RequestWithUser extends Request {
  user: MyJwtPayload;
}

@ApiTags('stats')
@ApiBearerAuth('bearerAuth')
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
  @ApiQuery({ name: 'limit', required: false })
  @ApiEmotionStatsOkResponse()
  async getMyEmotions(
    @Req() req: RequestWithUser,
    @Query() query: GetEmotionStatsQueryDto,
  ): Promise<{
    data: EmotionSummaryResponseDto[];
    meta: { totalCount: number };
  }> {
    const userId = req.user.sub;
    const { items, totalCount } = await this.statsService.getEmotionStats(
      userId,
      query.limit,
    );
    return {
      data: items,
      meta: { totalCount },
    };
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
}
