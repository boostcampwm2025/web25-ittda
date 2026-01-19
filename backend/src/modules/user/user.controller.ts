import {
  Controller,
  Get,
  Query,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { User } from '@/common/decorators/user.decorator';
import type { MyJwtPayload } from '../auth/auth.type';
import { GetMonthlyArchiveQueryDto } from './dto/get-monthly-archive.query.dto';
import { ApiWrappedOkResponse } from '@/common/swagger/api-wrapped-response.decorator';
import { MonthRecordResponseDto } from './dto/month-record.response.dto';

// 마이페이지/설정
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
      query.year ?? new Date().getFullYear(),
    );

    return { data };
  }
}
