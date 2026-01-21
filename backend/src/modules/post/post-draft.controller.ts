import {
  Controller,
  Get,
  Param,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { User } from '@/common/decorators/user.decorator';
import type { MyJwtPayload } from '../auth/auth.type';
import { PostDraftService } from './post-draft.service';

@UseGuards(JwtAuthGuard)
@Controller({ path: 'groups/:groupId', version: '1' })
export class PostDraftController {
  constructor(private readonly postDraftService: PostDraftService) {}

  @Get('posts/new')
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
    return {
      redirectUrl: `/add?groupId=${groupId}&draftId=${draft.id}`,
    };
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
}
