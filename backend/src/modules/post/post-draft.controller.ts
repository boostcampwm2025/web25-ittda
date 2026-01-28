import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Redirect,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiResponse, ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { User } from '@/common/decorators/user.decorator';
import type { MyJwtPayload } from '../auth/auth.type';
import { PostDraftService } from './post-draft.service';
import { PostPublishService } from './post-publish.service';
import { PostService } from './post.service';
import { PublishDraftDto } from './dto/publish-draft.dto';
import { DraftSnapshotResponseDto } from './dto/post-draft-response.dto';
import { PostDetailDto } from './dto/post-detail.dto';
import { ApiWrappedOkResponse } from '@/common/swagger/api-wrapped-response.decorator';

@UseGuards(JwtAuthGuard)
@ApiTags('drafts')
@Controller({ path: 'groups/:groupId', version: '1' })
export class PostDraftController {
  constructor(
    private readonly postDraftService: PostDraftService,
    private readonly postPublishService: PostPublishService,
    private readonly postService: PostService,
  ) {}

  @Get('posts/new')
  @Redirect('', 302)
  @ApiOperation({
    summary: '그룹 새 게시글 작성 진입',
    description:
      '활성화된 드래프트가 있으면 해당 드래프트로, 없으면 새로 생성하여 드래프트 편집 URL로 리다이렉트합니다.',
  })
  @ApiParam({ name: 'groupId', description: '그룹 ID' })
  @ApiResponse({
    status: 302,
    description: 'Redirects to the active draft edit URL.',
    headers: {
      Location: {
        description: 'Draft edit URL.',
        schema: { type: 'string' },
      },
    },
  })
  async enterGroupDraft(
    @User() user: MyJwtPayload,
    @Param('groupId') groupId: string,
  ) {
    const requesterId = user?.sub;
    if (!requesterId) {
      throw new UnauthorizedException('Access token is required.');
    }
    const draft = await this.postDraftService.getOrCreateGroupDraft(
      groupId,
      requesterId,
    );
    return { url: `/groups/${groupId}/posts/${draft.id}/edit` };
  }

  @Get('drafts/:draftId')
  @ApiOperation({
    summary: '그룹 드래프트 스냅샷 조회',
    description: '특정 드래프트의 최신 스냅샷과 버전을 조회합니다.',
  })
  @ApiParam({ name: 'groupId', description: '그룹 ID' })
  @ApiParam({ name: 'draftId', description: '드래프트 ID' })
  @ApiWrappedOkResponse({
    type: DraftSnapshotResponseDto,
    description: 'Returns draft snapshot with version metadata.',
  })
  async getGroupDraft(
    @User() user: MyJwtPayload,
    @Param('groupId') groupId: string,
    @Param('draftId') draftId: string,
  ) {
    const requesterId = user?.sub;
    if (!requesterId) {
      throw new UnauthorizedException('Access token is required.');
    }
    const draft = await this.postDraftService.getGroupDraft(
      groupId,
      draftId,
      requesterId,
    );
    return {
      snapshot: draft.snapshot,
      version: draft.version,
      ownerActorId: draft.ownerActorId,
    };
  }

  @Post('posts/publish')
  @ApiOperation({
    summary: '드래프트 발행',
    description: '완성된 드래프트를 실제 게시글로 변환하여 발행합니다.',
  })
  @ApiParam({ name: 'groupId', description: '그룹 ID' })
  @ApiWrappedOkResponse({ type: PostDetailDto })
  async publishGroupDraft(
    @User() user: MyJwtPayload,
    @Param('groupId') groupId: string,
    @Body() dto: PublishDraftDto,
  ) {
    const requesterId = user?.sub;
    if (!requesterId) {
      throw new UnauthorizedException('Access token is required.');
    }
    const postId = await this.postPublishService.publishGroupDraft(
      requesterId,
      groupId,
      dto,
    );
    return this.postService.findOne(postId);
  }
}
