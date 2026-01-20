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
  ApiBody,
  ApiExtraModels,
  ApiNoContentResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PostService } from './post.service';
import { CreatePostDto } from './dto/create-post.dto';
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
@ApiExtraModels(MoodValueDto, LocationValueDto, RatingValueDto, MediaValueDto)
@UseGuards(JwtAuthGuard)
@Controller({ path: 'posts', version: '1' })
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Get(':id')
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

  @HttpPost()
  @ApiBody({
    type: CreatePostDto,
    description:
      'MOOD 블록의 value.mood는 [행복, 슬픔, 설렘, 좋음, 놀람] 중 하나여야 합니다.<br/>' +
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

  @Delete(':id')
  @HttpCode(204)
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
