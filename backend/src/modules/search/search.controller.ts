import { Controller, Post, Body, Query, UseGuards, Get } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SearchService } from './search.service';
import {
  SearchPostsDto,
  PaginatedSearchResponseDto,
  RecentSearchKeywordsResponseDto,
  FrequentTagsResponseDto,
} from './dto/search.dto';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { User } from '@/common/decorators/user.decorator';
import { ApiWrappedOkResponse } from '@/common/swagger/api-wrapped-response.decorator';

import type { MyJwtPayload } from '../auth/auth.type';

@ApiTags('search')
@ApiBearerAuth('bearerAuth')
@Controller({ path: 'search', version: '1' })
@UseGuards(JwtAuthGuard)
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Post()
  @ApiOperation({
    summary: '통합 검색',
    description:
      '제목, 본문, 기간, 태그, 좌표 범위 등을 기준으로 게시글을 통합 검색합니다.',
  })
  @ApiQuery({
    name: 'cursor',
    required: false,
    description: '페이지네이션용 커서 (Base64 인코딩)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: '한 번에 조회할 게시글 수 (기본: 20)',
  })
  @ApiWrappedOkResponse({ type: PaginatedSearchResponseDto })
  async search(
    @User() user: MyJwtPayload,
    @Body() dto: SearchPostsDto,
    @Query('cursor') cursor?: string,
    @Query('limit') limit: number = 20,
  ): Promise<PaginatedSearchResponseDto> {
    const userId = user.sub;
    return this.searchService.searchPosts(userId, dto, cursor, Number(limit));
  }

  @Get('recent')
  @ApiOperation({
    summary: '최근 검색어',
    description: '로그인한 사용자의 최근 검색 키워드 목록을 가져옵니다.',
  })
  @ApiWrappedOkResponse({ type: RecentSearchKeywordsResponseDto })
  getRecentSearches(
    @User() user: MyJwtPayload,
  ): RecentSearchKeywordsResponseDto {
    const keywords = this.searchService.getRecentSearches(user.sub);
    return { keywords };
  }

  @Get('tags/stats')
  @ApiOperation({
    summary: '인기 태그 통계',
    description:
      '사용자가 본인 게시글에서 가장 자주 사용한 태그 통계를 조회합니다.',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: '조회할 태그 개수 (기본: 10)',
  })
  @ApiWrappedOkResponse({ type: FrequentTagsResponseDto })
  getFrequentTags(
    @User() user: MyJwtPayload,
    @Query('limit') limit: number = 10,
  ): FrequentTagsResponseDto {
    const tags = this.searchService.getTopTags(user.sub, Number(limit));
    return { tags };
  }
}
