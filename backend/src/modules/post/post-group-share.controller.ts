import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post as HttpPost,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { PostGroupShareService } from './post-group-share.service';
import {
  ShareToGroupsDto,
  PostGroupShareDto,
} from './dto/post-group-share.dto';
import { User } from '@/common/decorators/user.decorator';
import { ApiWrappedOkResponse } from '@/common/swagger/api-wrapped-response.decorator';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';

import type { MyJwtPayload } from '../auth/auth.type';

@ApiTags('posts')
@ApiBearerAuth('bearerAuth')
@UseGuards(JwtAuthGuard)
@Controller({ path: 'posts', version: '1' })
export class PostGroupShareController {
  constructor(private readonly postGroupShareService: PostGroupShareService) {}

  @HttpPost(':postId/group-shares')
  @ApiOperation({
    summary: '개인 글을 그룹들에 공유',
    description:
      '개인 글(scope=PERSONAL)을 원하는 그룹들에 공유합니다. 원작성자만 가능합니다.',
  })
  @ApiParam({ name: 'postId', description: '게시글 ID' })
  @ApiWrappedOkResponse({ type: PostGroupShareDto, isArray: true })
  async shareToGroups(
    @User() user: MyJwtPayload,
    @Param('postId') postId: string,
    @Body() dto: ShareToGroupsDto,
  ): Promise<PostGroupShareDto[]> {
    const ownerUserId = user?.sub;
    if (!ownerUserId) {
      throw new UnauthorizedException('Access token is required.');
    }
    return this.postGroupShareService.shareToGroups(
      postId,
      ownerUserId,
      dto.groupIds,
    );
  }

  @Get(':postId/group-shares')
  @ApiOperation({
    summary: '공유된 그룹 목록 조회',
    description:
      '이 글이 공유된 그룹 목록을 조회합니다. 원작성자만 가능합니다.',
  })
  @ApiParam({ name: 'postId', description: '게시글 ID' })
  @ApiWrappedOkResponse({ type: PostGroupShareDto, isArray: true })
  async listSharedGroups(
    @User() user: MyJwtPayload,
    @Param('postId') postId: string,
  ): Promise<PostGroupShareDto[]> {
    const requesterId = user?.sub;
    if (!requesterId) {
      throw new UnauthorizedException('Access token is required.');
    }
    return this.postGroupShareService.listSharedGroups(postId, requesterId);
  }

  @Delete(':postId/group-shares/:groupId')
  @HttpCode(204)
  @ApiOperation({
    summary: '그룹 공유 취소',
    description: '특정 그룹에 대한 공유를 취소합니다. 원작성자만 가능합니다.',
  })
  @ApiParam({ name: 'postId', description: '게시글 ID' })
  @ApiParam({ name: 'groupId', description: '공유 취소할 그룹 ID' })
  @ApiNoContentResponse()
  async unshareFromGroup(
    @User() user: MyJwtPayload,
    @Param('postId') postId: string,
    @Param('groupId') groupId: string,
  ): Promise<void> {
    const requesterId = user?.sub;
    if (!requesterId) {
      throw new UnauthorizedException('Access token is required.');
    }
    await this.postGroupShareService.unshareFromGroup(
      postId,
      requesterId,
      groupId,
    );
  }
}
