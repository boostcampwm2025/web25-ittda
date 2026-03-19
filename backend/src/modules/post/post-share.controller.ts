import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { PostService } from './post.service';
import { SharedPostResponseDto } from './dto/shared-post.dto';
import { ApiWrappedOkResponse } from '@/common/swagger/api-wrapped-response.decorator';

@ApiTags('posts')
@Controller({ path: 'posts', version: '1' })
export class PostShareController {
  constructor(private readonly postService: PostService) {}

  @Get('shared/:shareToken')
  @ApiOperation({
    summary: '공유된 기록 조회 (비인증)',
    description: '공유 토큰으로 기록을 조회합니다. 인증 없이 접근 가능합니다.',
  })
  @ApiParam({ name: 'shareToken', description: '공유 토큰 (UUID)' })
  @ApiWrappedOkResponse({ type: SharedPostResponseDto })
  async getSharedPost(
    @Param('shareToken') shareToken: string,
  ): Promise<SharedPostResponseDto> {
    return this.postService.findByShareToken(shareToken);
  }
}
