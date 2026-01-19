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
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { UpdateUserDto, UpdateSettingsDto } from './dto/update-user.dto';

import type { Request } from 'express';
import type { MyJwtPayload } from '../auth/auth.type';
import type { User } from './user.entity';
import type { TagCount, EmotionCount, UserStats } from './user.interface';

interface RequestWithUser extends Request {
  user: MyJwtPayload;
}
// 유저/마이페이지/설정
@Controller({
  path: 'me',
  version: '1',
})
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async getMyProfile(
    @Req() req: RequestWithUser,
  ): Promise<User & { stats: UserStats }> {
    const userId = req.user.sub;
    const user = await this.userService.findOne(userId);
    const stats = await this.userService.getUserStats(userId);

    return {
      ...user,
      stats,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Patch()
  updateProfile(
    @Req() req: RequestWithUser,
    @Body() dto: UpdateUserDto,
  ): Promise<User> {
    const userId = req.user.sub;
    return this.userService.updateProfile(
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
    const user = await this.userService.findOne(userId);
    return user.settings as Record<string, unknown>;
  }

  @UseGuards(JwtAuthGuard)
  @Patch('settings')
  async updateSettings(
    @Req() req: RequestWithUser,
    @Body() dto: UpdateSettingsDto,
  ): Promise<User> {
    const userId = req.user.sub;
    return this.userService.updateSettings(userId, dto.settings);
  }

  @UseGuards(JwtAuthGuard)
  @Get('tags')
  async getMyTags(
    @Req() req: RequestWithUser,
    @Query('sort') sort: 'recent' | 'frequent' = 'recent',
  ): Promise<TagCount[] | string[]> {
    const userId = req.user.sub;
    return this.userService.getTags(userId, sort);
  }

  @UseGuards(JwtAuthGuard)
  @Get('emotions')
  async getMyEmotions(
    @Req() req: RequestWithUser,
    @Query('sort') sort: 'recent' | 'frequent' = 'recent',
  ): Promise<EmotionCount[] | string[]> {
    const userId = req.user.sub;
    return this.userService.getEmotions(userId, sort);
  }

  @UseGuards(JwtAuthGuard)
  @Delete()
  async withdraw(@Req() req: RequestWithUser): Promise<void> {
    const userId = req.user.sub;
    await this.userService.softDeleteUser(userId);
  }
}
