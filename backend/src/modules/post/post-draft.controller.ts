import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { User } from '@/common/decorators/user.decorator';
import type { MyJwtPayload } from '../auth/auth.type';
import { PostDraftService } from './post-draft.service';
import { PostPublishService } from './post-publish.service';
import { PostService } from './post.service';
import { PublishDraftDto } from './dto/publish-draft.dto';
import { DraftSnapshotResponseDto } from './dto/post-draft-response.dto';
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
  @ApiResponse({
    status: 200,
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
    return { redirectUrl: `/group/${groupId}/post/${draft.id}` };
  }

  @Get('drafts/:draftId')
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
