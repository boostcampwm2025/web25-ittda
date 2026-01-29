import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { MapService } from './map.service';
import {
  MapPostsQueryDto,
  PaginatedMapPostsResponseDto,
} from './dto/map-query.dto';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { User } from '@/common/decorators/user.decorator';
import type { MyJwtPayload } from '../auth/auth.type';

@ApiTags('map')
@ApiBearerAuth('bearerAuth')
@Controller({ path: 'map', version: '1' })
@UseGuards(JwtAuthGuard)
export class MapController {
  constructor(private readonly mapService: MapService) {}

  @Get('posts')
  @ApiOperation({ summary: '반경 내 게시글 조회 (지도용)' })
  @ApiResponse({ type: PaginatedMapPostsResponseDto })
  async getPosts(
    @User() user: MyJwtPayload,
    @Query() queryDto: MapPostsQueryDto,
  ): Promise<PaginatedMapPostsResponseDto> {
    return this.mapService.findPostsWithinRadius(user.sub, queryDto);
  }
}
