import {
  Controller,
  Get,
  Patch,
  Delete,
  Body,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { MyPageService } from './mypage.service';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { UpdateMeDto, UpdateSettingsDto } from './dto/update-mypage.dto.ts';

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
  ): Promise<TagCount[] | string[]> {
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
  @Delete()
  async withdraw(@Req() req: RequestWithUser): Promise<void> {
    const userId = req.user.sub;
    await this.myPageService.softDeleteUser(userId);
  }
}
