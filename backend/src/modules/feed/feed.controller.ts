// src/modules/feed/feed.controller.ts
import {
  Controller,
  Get,
  Query,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { FeedQueryService } from './feed.query.service';
import { GetFeedQueryDto } from './dto/get-feed.query.dto';
import { ApiTags } from '@nestjs/swagger';
import { FeedCardResponseDto } from './dto/feed-card.response.dto';
import { ApiWrappedOkResponse } from '@/common/swagger/api-wrapped-response.decorator';
import { User } from '@/common/decorators/user.decorator';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import type { MyJwtPayload } from '../auth/auth.type';

@ApiTags('feed')
@UseGuards(JwtAuthGuard)
@Controller({ path: 'feed', version: '1' })
export class FeedController {
  constructor(private readonly feedQuery: FeedQueryService) {}

  @Get()
  @ApiWrappedOkResponse({ type: FeedCardResponseDto, isArray: true })
  async getFeed(
    @User() user: MyJwtPayload,
    @Query() query: GetFeedQueryDto,
  ): Promise<{
    data: FeedCardResponseDto[];
    meta: { warnings: unknown[]; feedLength: number };
  }> {
    const userId = user?.sub;
    if (!userId) {
      throw new UnauthorizedException('Access token is required.');
    }
    const { cards, warnings } = await this.feedQuery.getFeedForUser(
      userId,
      query,
    );
    return { data: cards, meta: { warnings, feedLength: cards.length } };
  }
}
