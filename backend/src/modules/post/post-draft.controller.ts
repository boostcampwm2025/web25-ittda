import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiResponse, ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { User } from '@/common/decorators/user.decorator';
import { GroupRoleGuard } from '../group/guards/group-roles.guard';
import { GroupRoles } from '../group/guards/group-roles.decorator';
import { PostDraftService } from './post-draft.service';
import { PostPublishService } from './post-publish.service';
import { PostService } from './post.service';
import { PublishDraftDto } from './dto/publish-draft.dto';
import {
  DraftEntryResponseDto,
  DraftSnapshotResponseDto,
} from './dto/post-draft-response.dto';
import { PostDetailDto } from './dto/post-detail.dto';
import { ApiWrappedOkResponse } from '@/common/swagger/api-wrapped-response.decorator';
import { GroupRoleEnum } from '@/enums/group-role.enum';

import type { MyJwtPayload } from '../auth/auth.type';

@UseGuards(JwtAuthGuard, GroupRoleGuard)
@GroupRoles(GroupRoleEnum.EDITOR)
@ApiTags('drafts')
@Controller({ path: 'groups/:groupId', version: '1' })
export class PostDraftController {
  constructor(
    private readonly postDraftService: PostDraftService,
    private readonly postPublishService: PostPublishService,
    private readonly postService: PostService,
  ) {}

  @Post('posts/new')
  @ApiResponse({
    status: 201,
    description:
      'Creates or redirects to the active draft edit URL. 그룹 ADMIN/EDITOR만 접근 가능합니다.',
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
    const draft = await this.postDraftService.getOrCreateGroupCreateDraft(
      groupId,
      requesterId,
    );
    return { redirectUrl: `/group/${groupId}/post/${draft.id}` };
  }

  @Post('posts/:postId/edit')
  @ApiOperation({
    summary: '그룹 게시글 공동 수정 드래프트 생성/재사용',
    description:
      '그룹 게시글 수정용 드래프트를 생성하거나 기존 드래프트를 반환합니다. 그룹 ADMIN/EDITOR만 접근 가능합니다.',
  })
  @ApiParam({ name: 'groupId', description: '그룹 ID' })
  @ApiParam({ name: 'postId', description: '게시글 ID' })
  @ApiWrappedOkResponse({
    type: DraftEntryResponseDto,
    description: 'Returns edit draft entry URL.',
  })
  async enterGroupEditDraft(
    @User() user: MyJwtPayload,
    @Param('groupId') groupId: string,
    @Param('postId') postId: string,
  ) {
    const requesterId = user?.sub;
    if (!requesterId) {
      throw new UnauthorizedException('Access token is required.');
    }
    const draft = await this.postDraftService.getOrCreateGroupEditDraft(
      groupId,
      postId,
      requesterId,
    );
    return { redirectUrl: `/group/${groupId}/post/${draft.id}` };
  }

  @Get('drafts/:draftId')
  @ApiOperation({
    summary: '그룹 드래프트 스냅샷 조회',
    description:
      '특정 드래프트의 최신 스냅샷과 버전을 조회합니다. 그룹 ADMIN/EDITOR만 접근 가능합니다.',
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
    return this.postService.findOne(postId, requesterId);
  }

  @Post('posts/:postId/edit/publish')
  @ApiOperation({
    summary: '그룹 게시글 수정 드래프트 반영',
    description: '수정 드래프트를 실제 게시글에 반영합니다.',
  })
  @ApiParam({ name: 'groupId', description: '그룹 ID' })
  @ApiParam({ name: 'postId', description: '게시글 ID' })
  @ApiWrappedOkResponse({ type: PostDetailDto })
  async publishGroupEditDraft(
    @User() user: MyJwtPayload,
    @Param('groupId') groupId: string,
    @Param('postId') postId: string,
    @Body() dto: PublishDraftDto,
  ) {
    const requesterId = user?.sub;
    if (!requesterId) {
      throw new UnauthorizedException('Access token is required.');
    }
    const updatedPostId = await this.postPublishService.publishGroupEditDraft(
      requesterId,
      groupId,
      postId,
      dto,
    );
    return this.postService.findOne(updatedPostId, requesterId);
  }
}
