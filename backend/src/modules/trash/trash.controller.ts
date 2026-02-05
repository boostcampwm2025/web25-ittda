import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiNoContentResponse,
} from '@nestjs/swagger';
import { TrashService } from './trash.service';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { User } from '@/common/decorators/user.decorator';
import type { MyJwtPayload } from '../auth/auth.type';
import { ApiWrappedOkResponse } from '@/common/swagger/api-wrapped-response.decorator';
import { TrashPostResponseDto } from './dto/trash.dto';

@ApiTags('trash')
@ApiBearerAuth('bearerAuth')
@UseGuards(JwtAuthGuard)
@Controller({ path: 'trash', version: '1' })
export class TrashController {
  constructor(private readonly trashService: TrashService) {}

  @Get('posts')
  @ApiOperation({
    summary: '휴지통 목록 조회',
    description: '현재 사용자가 삭제한 게시글 목록을 조회합니다.',
  })
  @ApiWrappedOkResponse({ type: TrashPostResponseDto, isArray: true })
  async getTrashPosts(@User() user: MyJwtPayload) {
    return this.trashService.getTrashPosts(user.sub);
  }

  @Post('posts/:postId/restore')
  @ApiOperation({
    summary: '게시글 복구',
    description: '휴지통에 있는 특정 게시글을 복구합니다.',
  })
  @ApiParam({ name: 'postId', description: '복구할 게시글 ID' })
  @ApiNoContentResponse({ description: '복구 성공' })
  @HttpCode(204)
  async restorePost(
    @User() user: MyJwtPayload,
    @Param('postId') postId: string,
  ) {
    await this.trashService.restorePost(user.sub, postId);
  }

  @Delete('posts/:postId')
  @ApiOperation({
    summary: '게시글 완전 삭제',
    description:
      '휴지통에 있는 게시글을 영구적으로 삭제합니다. 복구가 불가능합니다.',
  })
  @ApiParam({ name: 'postId', description: '영구 삭제할 게시글 ID' })
  @ApiNoContentResponse({ description: '삭제 성공' })
  @HttpCode(204)
  async hardDeletePost(
    @User() user: MyJwtPayload,
    @Param('postId') postId: string,
  ) {
    await this.trashService.hardDeletePost(user.sub, postId);
  }
}
