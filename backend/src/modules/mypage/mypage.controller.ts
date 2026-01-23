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
import { TagStatsResponseDto, TagCountDto } from './dto/tag-stats.response.dto';
import { UserSummaryResponseDto } from './dto/user-summary.response.dto';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';

import type { Request } from 'express';
import type { MyJwtPayload } from '../auth/auth.type';
import type { EmotionCount } from './mypage.interface';

interface RequestWithUser extends Request {
  user: MyJwtPayload;
}

// 마이페이지/설정
@ApiTags('mypage')
@ApiBearerAuth()
@Controller({
  path: 'me',
  version: '1',
})
export class MyPageController {
  constructor(private readonly myPageService: MyPageService) {}

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
    const stats = await this.myPageService.getUserStats(userId);

    return {
      ...user,
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
    const stats = await this.myPageService.getUserStats(userId);
    return { ...user, stats };
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
  @Get('tags')
  @ApiOperation({ summary: '전체 태그 목록 조회' })
  @ApiQuery({ name: 'sort', enum: ['recent', 'frequent'], required: false })
  @ApiWrappedOkResponse({ type: TagCountDto, isArray: true })
  async getMyTags(
    @Req() req: RequestWithUser,
    @Query('sort') sort: 'recent' | 'frequent' = 'recent',
  ): Promise<TagCountDto[]> {
    const userId = req.user.sub;
    return this.myPageService.getTags(userId, sort);
  }

  @UseGuards(JwtAuthGuard)
  @Get('emotions')
  @ApiOperation({ summary: '전체 감정 목록 조회' })
  @ApiQuery({ name: 'sort', enum: ['recent', 'frequent'], required: false })
  @ApiWrappedOkResponse({ type: String, isArray: true })
  async getMyEmotions(
    @Req() req: RequestWithUser,
    @Query('sort') sort: 'recent' | 'frequent' = 'recent',
  ): Promise<EmotionCount[] | string[]> {
    const userId = req.user.sub;
    return this.myPageService.getEmotions(userId, sort);
  }

  @UseGuards(JwtAuthGuard)
  @Get('emotions/summary')
  @ApiOperation({ summary: '월별 감정 요약' })
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
  @ApiOperation({ summary: '기간별 기록 수 요약' })
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
  @ApiOperation({ summary: '태그 통계 TOP 10' })
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
  @ApiOperation({ summary: '회원 탈퇴' })
  @ApiWrappedOkResponse({ type: Object })
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
