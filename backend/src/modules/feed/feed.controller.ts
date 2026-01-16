// src/modules/feed/feed.controller.ts
import { Controller, Get, Query, Req } from '@nestjs/common';
import { FeedQueryService } from './feed.query.service';
import { GetFeedQueryDto } from './dto/get-feed.query.dto';
import { ApiHeader, ApiTags } from '@nestjs/swagger';
import { FeedCardResponseDto } from './dto/feed-card.response.dto';
import { ApiWrappedOkResponse } from '@/common/swagger/api-wrapped-response.decorator';
import type { AuthedRequest } from '@/common/types/auth-request.type';

@ApiTags('feed')
@Controller({ path: 'feed', version: '1' })
export class FeedController {
  constructor(private readonly feedQuery: FeedQueryService) {}

  // TODO: 나중에 실제 유저를 바디로 받아야함
  // 지금은 임시로 헤더에서 userId 받도록 함
  // guest는 sessionId를 받도록
  @ApiHeader({
    name: 'x-user-id',
    description: '임시 사용자 ID (AuthGuard 적용 전)',
    required: false,
  })
  @Get()
  @ApiWrappedOkResponse({ type: FeedCardResponseDto, isArray: true })
  async getFeed(
    @Req() req: AuthedRequest,
    @Query() query: GetFeedQueryDto,
  ): Promise<{ data: FeedCardResponseDto[]; meta: { warnings: unknown[] } }> {
    const tempUserId = req.header('x-user-id');
    const userId =
      req.user?.id ?? (typeof tempUserId === 'string' ? tempUserId : undefined);

    if (!userId) {
      throw new Error(
        'userId is missing. Provide req.user.id or x-user-id header.',
      );
    }
    const { cards, warnings } = await this.feedQuery.getFeedForUser(
      userId,
      query,
    );
    return { data: cards, meta: { warnings } };
  }
}
