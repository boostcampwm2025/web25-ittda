import { Controller, Get, Param, Query, Post, Body } from '@nestjs/common';
import { PostService } from './post.service';
import { CreatePostDto, Post as PostType } from './post.types';

@Controller('posts')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Get()
  getPosts(@Query('bbox') bboxStr?: string, @Query('limit') limitStr?: string) {
    if (!bboxStr) {
      return {
        meta: { bbox: null, count: 0 },
        items: [],
      };
    }

    const parts = bboxStr.split(',').map((v) => Number(v));
    if (parts.length !== 4 || parts.some((v) => Number.isNaN(v))) {
      return {
        meta: { bbox: null, count: 0 },
        items: [],
      };
    }

    const [minLat, minLng, maxLat, maxLng] = parts;
    const limit = limitStr ? Number(limitStr) || 50 : 50;

    const items = this.postService.findByBbox(
      { minLat, minLng, maxLat, maxLng },
      limit,
    );

    return {
      meta: { bbox: { minLat, minLng, maxLat, maxLng }, count: items.length },
      items,
    };
  }

  @Get('list')
  getPostList(
    @Query('page') pageStr?: string,
    @Query('limit') limitStr?: string,
  ) {
    const page = pageStr ? Number(pageStr) || 1 : 1;
    const limit = limitStr ? Number(limitStr) || 10 : 10;

    const { items, totalCount } = this.postService.findPaginated(page, limit);
    const totalPages = totalCount === 0 ? 0 : Math.ceil(totalCount / limit);

    return {
      meta: {
        totalCount,
        currentPage: page,
        totalPages,
      },
      items,
    };
  }

  @Get(':id')
  getPost(@Param('id') id: string) {
    return this.postService.findOne(id);
  }

  @Post()
  createPost(@Body() body: CreatePostDto): PostType {
    return this.postService.createPost(body);
  }
}
