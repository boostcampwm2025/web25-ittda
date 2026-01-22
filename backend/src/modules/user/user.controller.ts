import {
  Body,
  BadRequestException,
  Controller,
  Get,
  Patch,
  Param,
  Query,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { User } from '@/common/decorators/user.decorator';

import { GetMonthlyArchiveQueryDto } from './dto/get-monthly-archive.query.dto';
import { ApiWrappedOkResponse } from '@/common/swagger/api-wrapped-response.decorator';
import { MonthRecordResponseDto } from './dto/month-record.response.dto';
import { GetMonthImagesResponseDto } from './dto/get-month-images.response.dto';
import { UpdateMonthCoverBodyDto } from './dto/update-month-cover.body.dto';
import { GetDailyArchiveQueryDto } from './dto/get-daily-archive.query.dto';
import { DayRecordResponseDto } from './dto/day-record.response.dto';
import { GetArchivesMonthCoverQueryDto } from './dto/get-archives-month-cover.query.dto';

import type { MyJwtPayload } from '../auth/auth.type';

// 내 기록함 포함 사용자 관련 api
@ApiTags('user')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({
  path: 'user',
  version: '1',
})
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('archives/months')
  @ApiOperation({
    summary: '사용자 월별 아카이브 조회',
    description: '로그인한 사용자의 월별 기록 요약 목록을 조회합니다.',
  })
  @ApiWrappedOkResponse({ type: MonthRecordResponseDto, isArray: true })
  async getMonthlyArchive(
    @User() user: MyJwtPayload,
    @Query() query: GetMonthlyArchiveQueryDto,
  ): Promise<{ data: MonthRecordResponseDto[] }> {
    const userId = user?.sub;
    if (!userId) {
      throw new UnauthorizedException('Access token is required.');
    }

    const data = await this.userService.getMonthlyArchive(
      userId,
      query.year ?? new Date().getFullYear(), // 기본값: 올해
    );

    return { data };
  }

  @Get('archives/months/:yyyy_mm/images')
  @ApiOperation({
    summary: '사용자 월별 이미지 조회',
    description:
      '특정 월의 모든 기록에서 사용된 이미지 목록을 조회합니다. (deprecated: archives/monthcover 권장)',
  })
  @ApiParam({ name: 'yyyy_mm', description: '연-월 (예: 2026-01)' })
  @ApiWrappedOkResponse({ type: GetMonthImagesResponseDto })
  async getMonthImages(
    @User() user: MyJwtPayload,
    @Param('yyyy_mm') yyyy_mm: string,
  ): Promise<{ data: GetMonthImagesResponseDto }> {
    const userId = user?.sub;
    if (!userId) {
      throw new UnauthorizedException('Access token is required.');
    }

    const { year, month } = this.parseYearMonth(yyyy_mm);

    const images = await this.userService.getMonthImages(userId, year, month);
    return { data: { images } };
  }

  @Patch('archives/months/:yyyy_mm/cover')
  @ApiOperation({
    summary: '사용자 월별 커버 변경',
    description: '특정 월의 카드 커버 이미지를 변경합니다.',
  })
  @ApiParam({ name: 'yyyy_mm', description: '연-월 (예: 2026-01)' })
  @ApiWrappedOkResponse({ type: Object })
  async updateMonthCover(
    @User() user: MyJwtPayload,
    @Param('yyyy_mm') yyyy_mm: string,
    @Body() body: UpdateMonthCoverBodyDto,
  ) {
    const userId = user?.sub;
    if (!userId) {
      throw new UnauthorizedException('Access token is required.');
    }

    const { year, month } = this.parseYearMonth(yyyy_mm);

    await this.userService.updateMonthCover(
      userId,
      year,
      month,
      body.coverAssetId,
    );
    return { data: { coverAssetId: body.coverAssetId } };
  }

  @Get('archives/days')
  @ApiOperation({
    summary: '사용자 일별 아카이브 조회',
    description: '로그인한 사용자의 특정 월 일별 기록 요약 목록을 조회합니다.',
  })
  @ApiWrappedOkResponse({ type: DayRecordResponseDto, isArray: true })
  async getDailyArchive(
    @User() user: MyJwtPayload,
    @Query() query: GetDailyArchiveQueryDto,
  ): Promise<{ data: DayRecordResponseDto[] }> {
    const userId = user?.sub;
    if (!userId) {
      throw new UnauthorizedException('Access token is required.');
    }

    const { year, month } = this.parseYearMonth(query.month);

    const data = await this.userService.getDailyArchive(userId, year, month);
    return { data };
  }

  @Get('archives/record-days')
  @ApiOperation({
    summary: '기록이 있는 날짜 조회',
    description: '특정 월 중 기록이 있는 날짜 목록을 조회합니다.',
  })
  @ApiWrappedOkResponse({ type: String, isArray: true })
  async getRecordedDays(
    @User() user: MyJwtPayload,
    @Query() query: GetDailyArchiveQueryDto,
  ): Promise<{ data: string[] }> {
    const userId = user?.sub;
    if (!userId) {
      throw new UnauthorizedException('Access token is required.');
    }

    const { year, month } = this.parseYearMonth(query.month);
    const data = await this.userService.getRecordedDays(userId, year, month);

    return { data };
  }

  @Get('archives/monthcover')
  @ApiOperation({
    summary: '사용자 월별 커버 후보 이미지 조회',
    description: '특정 월의 모든 기록에서 사용된 이미지 목록을 조회합니다.',
  })
  @ApiWrappedOkResponse({ type: String, isArray: true })
  async getArchivesMonthCover(
    @User() user: MyJwtPayload,
    @Query() query: GetArchivesMonthCoverQueryDto,
  ): Promise<{ data: string[] }> {
    const userId = user?.sub;
    if (!userId) {
      throw new UnauthorizedException('Access token is required.');
    }

    const { year, month } = this.parseYearMonth(query.year);
    const data = await this.userService.getMonthImages(userId, year, month);

    return { data };
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
