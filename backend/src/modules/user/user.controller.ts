import {
  Controller,
  Get,
  Patch,
  Delete,
  Body,
  UseGuards,
  Query,
} from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { UpdateUserDto, UpdateSettingsDto } from './dto/update-user.dto';

import type { User } from './user.entity';
import type { TagCount } from './user.interface';
import { User as UserDecorator } from '@/common/decorators/user.decorator';
import type { MyJwtPayload } from '../auth/auth.type';

@UseGuards(JwtAuthGuard)
@Controller({
  path: 'me',
  version: '1',
})
export class UserController {
  constructor(private readonly userService: UserService) {}

  // @Get()
  // async getMyProfile(
  //   @UserDecorator() userPayload: MyJwtPayload,
  // ): Promise<User & { stats: UserStats }> {
  //   const userId = userPayload.sub;
  //   const user = await this.userService.findOne(userId);
  //   const stats = await this.userService.getUserStats(userId);

  //   return {
  //     ...user,
  //     stats,
  //   };
  // }

  @Patch()
  updateProfile(
    @UserDecorator() user: MyJwtPayload,
    @Body() dto: UpdateUserDto,
  ): Promise<User> {
    const userId = user.sub;
    return this.userService.updateProfile(
      userId,
      dto.nickname,
      dto.profileImageId,
    );
  }

  @Get('settings')
  async getMySettings(
    @UserDecorator() userPayload: MyJwtPayload,
  ): Promise<Record<string, unknown>> {
    const userId = userPayload.sub;
    const user = await this.userService.findOne(userId);
    return user.settings as Record<string, unknown>;
  }

  @Patch('settings')
  async updateSettings(
    @UserDecorator() user: MyJwtPayload,
    @Body() dto: UpdateSettingsDto,
  ): Promise<User> {
    const userId = user.sub;
    return this.userService.updateSettings(userId, dto.settings);
  }

  @Get('tags')
  async getMyTags(
    @UserDecorator() user: MyJwtPayload,
    @Query('sort') sort: 'recent' | 'frequent' = 'recent',
  ): Promise<TagCount[] | string[]> {
    const userId = user.sub;
    return this.userService.getTags(userId, sort);
  }

  // @Get('emotions')
  // async getMyEmotions(
  //   @UserDecorator() user: MyJwtPayload,
  //   @Query('sort') sort: 'recent' | 'frequent' = 'recent',
  // ): Promise<EmotionCount[] | string[]> {
  //   const userId = user.sub;
  //   return this.userService.getEmotions(userId, sort);
  // }

  @Delete()
  async withdraw(@UserDecorator() user: MyJwtPayload): Promise<void> {
    const userId = user.sub;
    await this.userService.softDeleteUser(userId);
  }
}
