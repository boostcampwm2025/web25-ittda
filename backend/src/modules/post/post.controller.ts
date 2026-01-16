import {
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post as HttpPost,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiNoContentResponse, ApiTags } from '@nestjs/swagger';
import { PostService } from './post.service';
import { CreatePostDto } from './dto/create-post.dto';
import { PostDetailDto } from './dto/post-detail.dto';
import { User } from '@/common/decorators/user.decorator';
import {
  ApiWrappedCreatedResponse,
  ApiWrappedOkResponse,
} from '@/common/swagger/api-wrapped-response.decorator';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import type { MyJwtPayload } from '../auth/auth.type';

@ApiTags('posts')
@UseGuards(JwtAuthGuard)
@Controller({ path: 'posts', version: '1' })
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Get(':id')
  @ApiWrappedOkResponse({ type: PostDetailDto })
  getOne(@Param('id') id: string): Promise<PostDetailDto> {
    // TODO: 이 유저가 해당 postId를 볼 권한이 있는지 확인하는 로직 추가
    return this.postService.findOne(id);
  }

  @HttpPost()
  @ApiWrappedCreatedResponse({ type: PostDetailDto })
  create(
    @User() user: MyJwtPayload,
    @Body() dto: CreatePostDto,
  ): Promise<PostDetailDto> {
    const ownerId = user?.sub;
    if (!ownerId) {
      throw new Error('ownerId is missing. Provide a valid access token.');
    }
    return this.postService.createPost(ownerId, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiNoContentResponse()
  async deleteOne(
    @User() user: MyJwtPayload,
    @Param('id') id: string,
  ): Promise<void> {
    const requesterId = user?.sub;
    if (!requesterId) {
      throw new Error('requesterId is missing. Provide a valid access token.');
    }
    await this.postService.deletePost(id, requesterId);
  }
}
