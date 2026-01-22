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

import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { User } from '@/common/decorators/user.decorator';
import type { MyJwtPayload } from '../auth/auth.type';
import { PostDraftService } from './post-draft.service';
import { PostPublishService } from './post-publish.service';
import { PostService } from './post.service';
import { PublishDraftDto } from './dto/publish-draft.dto';

@UseGuards(JwtAuthGuard)
@Controller({ path: 'groups/:groupId', version: '1' })
export class PostDraftController {
  constructor(
    private readonly postDraftService: PostDraftService,
    private readonly postPublishService: PostPublishService,
    private readonly postService: PostService,
  ) {}

  @Get('posts/new')
  @Redirect('', 302)
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
  async getGroupDraft(
    @User() user: MyJwtPayload,
    @Param('groupId') groupId: string,
    @Param('draftId') draftId: string,
  ) {
    const requesterId = user?.sub;
    if (!requesterId) {
      throw new UnauthorizedException('Access token is required.');
    }
    const draft = await this.postDraftService.getGroupDraft(groupId, draftId);
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
