// src/modules/feed/feed.controller.ts
import {
  Controller,
  Get,
  Param,
  Query,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { GetFeedQueryDto } from './dto/get-feed.query.dto';
import { ApiParam, ApiTags } from '@nestjs/swagger';
import { FeedCardResponseDto } from './dto/feed-card.response.dto';
import { User } from '@/common/decorators/user.decorator';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import type { MyJwtPayload } from '../auth/auth.type';
import { FeedQueryService } from './feed.query.service';
import { FeedPersonalQueryService } from './feed.personal.query.service';
import { FeedGroupQueryService } from './feed.group.query.service';
import { GroupRoleGuard } from '../group/guards/group-roles.guard';
import { GroupRoles } from '../group/guards/group-roles.decorator';
import { GroupRoleEnum } from '@/enums/group-role.enum';
import { ApiFeedOkResponse } from './feed.swagger';

@ApiTags('feed')
@UseGuards(JwtAuthGuard)
@Controller({ path: 'feed', version: '1' })
export class FeedController {
  constructor(
    private readonly feedQuery: FeedQueryService,
    private readonly feedPersonalQuery: FeedPersonalQueryService,
    private readonly feedGroupQuery: FeedGroupQueryService,
  ) {}

  @Get()
  @ApiFeedOkResponse()
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

  @Get('personal')
  @ApiFeedOkResponse()
  async getPersonalFeed(
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
    const { cards, warnings } =
      await this.feedPersonalQuery.getPersonalFeedForUser(userId, query);
    return { data: cards, meta: { warnings, feedLength: cards.length } };
  }

  @Get('groups/:groupId')
  @UseGuards(GroupRoleGuard)
  @GroupRoles(GroupRoleEnum.ADMIN, GroupRoleEnum.EDITOR, GroupRoleEnum.VIEWER)
  @ApiParam({ name: 'groupId', description: '그룹 ID' })
  @ApiFeedOkResponse()
  async getGroupFeed(
    @Param('groupId') groupId: string,
    @Query() query: GetFeedQueryDto,
  ): Promise<{
    data: FeedCardResponseDto[];
    meta: { warnings: unknown[]; feedLength: number };
  }> {
    const { cards, warnings } = await this.feedGroupQuery.getGroupFeed(
      groupId,
      query,
    );
    return { data: cards, meta: { warnings, feedLength: cards.length } };
  }
}
