import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MapService } from './map.service';
import {
  MapPostsQueryDto,
  PaginatedMapPostsResponseDto,
} from './dto/map-query.dto';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { User } from '@/common/decorators/user.decorator';
import { ApiWrappedOkResponse } from '@/common/swagger/api-wrapped-response.decorator';
import type { MyJwtPayload } from '../auth/auth.type';

@ApiTags('map')
@ApiBearerAuth('bearerAuth')
@Controller({ path: 'map', version: '1' })
@UseGuards(JwtAuthGuard)
export class MapController {
  constructor(private readonly mapService: MapService) {}

  @Get('posts')
  @ApiOperation({
    summary: '지도 기반 게시글 조회',
    description:
      '좌표(latitude, longitude)와 반경(radius)을 기준으로 현재 위치 주변의 게시글 목록을 조회합니다. scope에 따라 본인, 그룹, 전체 공개 글을 필터링할 수 있습니다.',
  })
  @ApiWrappedOkResponse({ type: PaginatedMapPostsResponseDto })
  async getPosts(
    @User() user: MyJwtPayload,
    @Query() queryDto: MapPostsQueryDto,
  ): Promise<PaginatedMapPostsResponseDto> {
    return this.mapService.findPostsWithinRadius(user.sub, queryDto);
  }
}
