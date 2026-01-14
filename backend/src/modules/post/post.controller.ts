import {
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post as HttpPost,
  Body,
  Req,
  NotImplementedException,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiHeader,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PostService } from './post.service';
import { CreatePostDto } from './dto/create-post.dto';
import { PostDetailDto } from './dto/post-detail.dto';
import type { Request } from 'express';

type AuthedRequest = Request & {
  user?: { id: string };
};

@ApiTags('posts')
@Controller({ path: 'posts', version: '1' })
export class PostController {
  constructor(private readonly postService: PostService) {}

  @ApiHeader({
    name: 'x-user-id',
    description: '임시 사용자 ID (AuthGuard 적용 전)',
    required: false,
  })
  @Get('list')
  getPostList() {
    throw new NotImplementedException(
      'PostController.getPostList is not ready',
    );
  }

  @ApiHeader({
    name: 'x-user-id',
    description: '임시 사용자 ID (AuthGuard 적용 전)',
    required: false,
  })
  @Get(':id')
  @ApiOkResponse({ type: PostDetailDto })
  getOne(@Param('id') id: string): Promise<PostDetailDto> {
    return this.postService.findOne(id);
  }

  // TODO: 나중에 AuthGuard 붙이기
  @HttpPost()
  @ApiCreatedResponse({ type: PostDetailDto })
  @ApiHeader({
    name: 'x-user-id',
    description: '임시 사용자 ID (AuthGuard 적용 전)',
    required: false,
  })
  create(
    @Req() req: AuthedRequest,
    @Body() dto: CreatePostDto,
  ): Promise<PostDetailDto> {
    // 임시: authorId를 헤더로 받거나, 테스트용 고정
    // TODO: 실제론 JWT payload에서 userId를 뽑아야 함
    const headerUserId = req.header('x-user-id');
    const ownerId =
      req.user?.id ??
      (typeof headerUserId === 'string' ? headerUserId : undefined);
    if (!ownerId) {
      // 개발 단계에서만 허용: 테스트용
      throw new Error(
        'ownerId is missing. Provide req.user.id or x-user-id header.',
      );
    }
    return this.postService.createPost(ownerId, dto);
  }

  // TODO: 나중에 AuthGuard 붙이기
  @Delete(':id')
  @HttpCode(204)
  @ApiNoContentResponse()
  @ApiHeader({
    name: 'x-user-id',
    description: '임시 사용자 ID (AuthGuard 적용 전)',
    required: false,
  })
  async deleteOne(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
  ): Promise<void> {
    const headerUserId = req.header('x-user-id');
    const requesterId =
      req.user?.id ??
      (typeof headerUserId === 'string' ? headerUserId : undefined);
    if (!requesterId) {
      throw new Error(
        'requesterId is missing. Provide req.user.id or x-user-id header.',
      );
    }
    await this.postService.deletePost(id, requesterId);
  }
}
