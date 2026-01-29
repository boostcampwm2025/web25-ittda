import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post as HttpPost,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiExtraModels,
  ApiNoContentResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { PostService } from './post.service';
import { CreatePostDto } from './dto/create-post.dto';
import { EditPostDto } from './dto/edit-post.dto';
import { PostDetailDto } from './dto/post-detail.dto';
import {
  LocationValueDto,
  MoodValueDto,
  RatingValueDto,
  MediaValueDto,
} from './dto/post-block.dto';
import { User } from '@/common/decorators/user.decorator';
import {
  ApiWrappedCreatedResponse,
  ApiWrappedOkResponse,
} from '@/common/swagger/api-wrapped-response.decorator';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';

import type { MyJwtPayload } from '../auth/auth.type';

@ApiTags('posts')
@ApiBearerAuth('bearerAuth')
@ApiExtraModels(MoodValueDto, LocationValueDto, RatingValueDto, MediaValueDto)
@UseGuards(JwtAuthGuard)
@Controller({ path: 'posts', version: '1' })
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Get(':id')
  @ApiOperation({
    summary: '게시글 상세 조회',
    description:
      '특정 ID의 게시글 상세 정보를 조회합니다. 조회 권한이 필요합니다.',
  })
  @ApiParam({ name: 'id', description: '게시글 ID' })
  @ApiWrappedOkResponse({ type: PostDetailDto })
  async getOne(
    @User() user: MyJwtPayload,
    @Param('id') id: string,
  ): Promise<PostDetailDto> {
    const requesterId = user?.sub;
    if (!requesterId) {
      throw new UnauthorizedException('Access token is required.');
    }
    await this.postService.ensureCanViewPost(id, requesterId);
    return this.postService.findOne(id);
  }

  @Get(':postId/edit')
  @ApiOperation({
    summary: '게시글 수정 스냅샷 조회',
    description:
      '게시글 수정을 위한 스냅샷을 조회합니다. 그룹 글은 ADMIN/EDITOR 권한만 수정 가능합니다.',
  })
  @ApiParam({ name: 'postId', description: '게시글 ID' })
  @ApiWrappedOkResponse({ type: EditPostDto })
  async getEditSnapshot(
    @User() user: MyJwtPayload,
    @Param('postId') postId: string,
  ): Promise<EditPostDto> {
    const requesterId = user?.sub;
    if (!requesterId) {
      throw new UnauthorizedException('Access token is required.');
    }
    return this.postService.getEditSnapshot(postId, requesterId);
  }

  @HttpPost()
  @ApiOperation({
    summary: '게시글 생성',
    description: '새로운 게시글을 작성합니다. 블록 단위로 본문을 구성합니다.',
  })
  @ApiBody({
    type: CreatePostDto,
    description:
      'MOOD 블록의 value.mood는 [행복, 좋음, 만족, 재미, 보통, 피곤, 놀람, 화남, 슬픔, 아픔, 짜증] 중 하나여야 합니다.<br/>' +
      'LOCATION 블록은 lat/lng/address가 필요하며 placeName은 선택입니다.<br/>' +
      'RATING 블록의 value.rating은 소수점 한 자리까지 허용됩니다.<br/>' +
      'MEDIA 블록의 value에는 title, type, externalId가 필수이며 year/imageUrl/originalTitle은 선택입니다.',
  })
  @ApiWrappedCreatedResponse({ type: PostDetailDto })
  create(
    @User() user: MyJwtPayload,
    @Body() dto: CreatePostDto,
  ): Promise<PostDetailDto> {
    const ownerId = user?.sub;
    if (!ownerId) {
      throw new UnauthorizedException('Access token is required.');
    }
    return this.postService.createPost(ownerId, dto);
  }

  @Patch(':postId')
  @ApiOperation({
    summary: '게시글 수정',
    description:
      '기존 게시글을 수정합니다. 블록 전체를 교체합니다. 그룹 글은 ADMIN/EDITOR 권한만 수정 가능합니다.',
  })
  @ApiParam({ name: 'postId', description: '게시글 ID' })
  @ApiBody({
    type: EditPostDto,
    description: '게시글 편집 스냅샷 전체를 전달합니다.',
  })
  @ApiWrappedOkResponse({ type: PostDetailDto })
  async updatePost(
    @User() user: MyJwtPayload,
    @Param('postId') postId: string,
    @Body() dto: EditPostDto,
  ): Promise<PostDetailDto> {
    const requesterId = user?.sub;
    if (!requesterId) {
      throw new UnauthorizedException('Access token is required.');
    }
    return this.postService.updatePost(postId, requesterId, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({
    summary: '게시글 삭제',
    description: '특정 ID의 게시글을 삭제합니다. 작성자만 삭제 가능합니다.',
  })
  @ApiParam({ name: 'id', description: '게시글 ID' })
  @ApiNoContentResponse()
  async deleteOne(
    @User() user: MyJwtPayload,
    @Param('id') id: string,
  ): Promise<void> {
    const requesterId = user?.sub;
    if (!requesterId) {
      throw new UnauthorizedException('Access token is required.');
    }
    await this.postService.deletePost(id, requesterId);
  }
}
