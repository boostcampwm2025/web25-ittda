import { Controller, Post, Body, Query, UseGuards, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { SearchService } from './search.service';
import {
  SearchPostsDto,
  PaginatedSearchResponseDto,
  RecentSearchKeywordsResponseDto,
  FrequentTagsResponseDto,
} from './dto/search.dto';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { User } from '@/common/decorators/user.decorator';

import type { MyJwtPayload } from '../auth/auth.type';

@ApiTags('search')
@Controller({ path: 'search', version: '1' })
@UseGuards(JwtAuthGuard)
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Post()
  @ApiOperation({ summary: '통합 검색 (제목/내용/날짜/태그/주변)' })
  @ApiQuery({
    name: 'cursor',
    required: false,
    description: '페이지네이션 커서',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: '불러올 개수 (기본 20)',
  })
  @ApiResponse({ type: PaginatedSearchResponseDto })
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
  @ApiOperation({ summary: '최근 검색어 조회' })
  @ApiResponse({ type: RecentSearchKeywordsResponseDto })
  getRecentSearches(
    @User() user: MyJwtPayload,
  ): RecentSearchKeywordsResponseDto {
    const keywords = this.searchService.getRecentSearches(user.sub);
    return { keywords };
  }

  @Get('tags/stats')
  @ApiOperation({ summary: '자주 쓰는 태그 조회 (누적 Top 10)' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: '조회 개수 (기본 10)',
  })
  @ApiResponse({ type: FrequentTagsResponseDto })
  getFrequentTags(
    @User() user: MyJwtPayload,
    @Query('limit') limit: number = 10,
  ): FrequentTagsResponseDto {
    const tags = this.searchService.getTopTags(user.sub, Number(limit));
    return { tags };
  }
}
