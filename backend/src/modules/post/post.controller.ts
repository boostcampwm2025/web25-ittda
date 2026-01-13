import {
  Controller,
  Get,
  Param,
  Post as HttpPost,
  Body,
  Req,
  NotImplementedException,
} from '@nestjs/common';
import { PostService } from './post.service';
import { CreatePostDto } from './dto/create-post.dto';
import { PostDetailDto } from './dto/post-detail.dto';
import type { Request } from 'express';

type AuthedRequest = Request & {
  user?: { id: string };
};

@Controller({ path: 'posts', version: '1' })
export class PostController {
  constructor(private readonly postService: PostService) {}

  // TODO: 나중에 구현 예정
  @Get()
  getPosts() {
    throw new NotImplementedException('PostController.getPosts is not ready');
  }

  @Get('list')
  getPostList() {
    throw new NotImplementedException(
      'PostController.getPostList is not ready',
    );
  }

  @Get(':id')
  getOne(@Param('id') id: string): Promise<PostDetailDto> {
    return this.postService.findOne(id);
  }

  // TODO: 나중에 AuthGuard 붙이기
  @HttpPost()
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
}
