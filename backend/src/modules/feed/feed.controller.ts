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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
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
@ApiBearerAuth('bearerAuth')
@UseGuards(JwtAuthGuard)
@Controller({ path: 'feed', version: '1' })
export class FeedController {
  constructor(
    private readonly feedQuery: FeedQueryService,
    private readonly feedPersonalQuery: FeedPersonalQueryService,
    private readonly feedGroupQuery: FeedGroupQueryService,
  ) {}

  @Get()
  @ApiOperation({
    summary: '통합 피드 조회',
    description: '나의 기록과 내가 속한 그룹의 기록을 통합하여 조회합니다.',
  })
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
  @ApiOperation({
    summary: '개인 피드 조회',
    description: '나의 개인 기록들만 피드 형태로 조회합니다.',
  })
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
  @ApiOperation({
    summary: '그룹 피드 조회',
    description: '특정 그룹의 멤버들이 작성한 기록들을 피드로 조회합니다.',
  })
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
