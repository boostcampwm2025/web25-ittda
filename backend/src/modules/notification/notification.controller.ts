import { Body, Controller, Delete, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '@/modules/auth/jwt/jwt.guard';
import { NotificationService } from './notification.service';
import { RegisterFcmTokenDto } from './dto/register-fcm-token.dto';

interface RequestWithUser extends Request {
  user: { sub: string };
}

@UseGuards(JwtAuthGuard)
@Controller('api/notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post('fcm-token')
  async registerToken(
    @Req() req: RequestWithUser,
    @Body() dto: RegisterFcmTokenDto,
  ) {
    await this.notificationService.registerToken(
      req.user.sub,
      dto.token,
      dto.platform,
    );
    return { success: true };
  }

  @Delete('fcm-token')
  async removeToken(
    @Req() req: RequestWithUser,
    @Body() dto: Pick<RegisterFcmTokenDto, 'platform'>,
  ) {
    await this.notificationService.removeToken(req.user.sub, dto.platform);
    return { success: true };
  }
}
