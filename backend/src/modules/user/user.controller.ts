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
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { User } from '@/common/decorators/user.decorator';

import { GetMonthlyArchiveQueryDto } from './dto/get-monthly-archive.query.dto';
import { ApiWrappedOkResponse } from '@/common/swagger/api-wrapped-response.decorator';
import { MonthRecordResponseDto } from './dto/month-record.response.dto';
import { GetMonthImagesResponseDto } from './dto/get-month-images.response.dto';
import { UpdateMonthCoverBodyDto } from './dto/update-month-cover.body.dto';
import { GetDailyArchiveQueryDto } from './dto/get-daily-archive.query.dto';
import { DayRecordResponseDto } from './dto/day-record.response.dto';

import type { MyJwtPayload } from '../auth/auth.type';

// 내 기록함 포함 사용자 관련 api
@ApiTags('user')
@UseGuards(JwtAuthGuard)
@Controller({
  path: 'user',
  version: '1',
})
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('archives/months')
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

    await this.userService.updateMonthCover(userId, year, month, body.coverUrl);

    return { data: { coverUrl: body.coverUrl } };
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

  @Get('archives/days')
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
}
