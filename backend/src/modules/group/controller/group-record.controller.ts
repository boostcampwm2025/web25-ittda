import {
  Controller,
  Patch,
  Get,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { GroupRecordService } from '../service/group-record.service';
import { JwtAuthGuard } from '../../auth/jwt/jwt.guard';
import { GroupRoleGuard } from '../guards/group-roles.guard';
import { GroupRoles } from '../guards/group-roles.decorator';
import { GroupRoleEnum } from '@/enums/group-role.enum';
import { UpdateGroupMonthCoverDto } from '../dto/update-group-month-cover.dto';
import {
  GetGroupMonthlyArchiveQueryDto,
  GroupArchiveSortEnum,
} from '../dto/get-group-monthly-archive.query.dto';
import { GetGroupDailyArchiveQueryDto } from '../dto/get-group-daily-archive.query.dto';
import { GetGroupMonthImagesQueryDto } from '../dto/get-group-month-images.query.dto';
import { ApiWrappedOkResponse } from '@/common/swagger/api-wrapped-response.decorator';
import { PaginatedGroupMonthRecordResponseDto } from '../dto/group-month-record.response.dto';
import { GroupDayRecordResponseDto } from '../dto/group-day-record.response.dto';
import { GetGroupCoverCandidatesQueryDto } from '../dto/get-group-cover-candidates.query.dto';
import { GroupCoverCandidatesResponseDto } from '../dto/group-cover-candidates.response.dto';
import { parseYearMonth } from '@/common/utils/parseDateValidator';

@ApiTags('group-records')
@ApiBearerAuth('bearerAuth')
@Controller({
  path: 'groups',
  version: '1',
})
@UseGuards(JwtAuthGuard)
export class GroupRecordController {
  constructor(private readonly groupRecordService: GroupRecordService) {}

  /**
   * 그룹 월별 커버 변경
   */
  @UseGuards(GroupRoleGuard)
  @GroupRoles(GroupRoleEnum.EDITOR)
  @Patch(':groupId/archives/months/:yyyy_mm/cover')
  @ApiOperation({
    summary: '그룹 월별 커버 변경',
    description:
      '특정 월의 카드 커버 이미지를 변경합니다. EDITOR 이상의 권한이 필요합니다.',
  })
  @ApiParam({ name: 'groupId', description: '그룹 ID' })
  @ApiParam({ name: 'yyyy_mm', description: '연-월 (예: 2026-01)' })
  @ApiWrappedOkResponse({ type: Object })
  async updateMonthCover(
    @Param('groupId') groupId: string,
    @Param('yyyy_mm') yyyy_mm: string,
    @Body() body: UpdateGroupMonthCoverDto,
  ) {
    const { year, month } = parseYearMonth(yyyy_mm);

    const result = await this.groupRecordService.updateMonthCover(
      groupId,
      year,
      month,
      body.assetId,
      body.sourcePostId,
    );

    return { data: result };
  }

  /**
   * 그룹 월별 기록 조회
   */
  @UseGuards(GroupRoleGuard)
  @GroupRoles(GroupRoleEnum.VIEWER)
  @Get(':groupId/archives/months')
  @ApiOperation({
    summary: '그룹 월별 아카이브 조회',
    description: '그룹의 월별 기록 요약 목록을 조회합니다.',
  })
  @ApiParam({ name: 'groupId', description: '그룹 ID' })
  @ApiWrappedOkResponse({ type: PaginatedGroupMonthRecordResponseDto })
  async getMonthlyArchive(
    @Param('groupId') groupId: string,
    @Query() query: GetGroupMonthlyArchiveQueryDto,
  ) {
    const year = query.year; // optional
    const sort = query.sort ?? GroupArchiveSortEnum.LATEST;
    const { cursor, limit = 12 } = query;

    const data = await this.groupRecordService.getMonthlyArchive(
      groupId,
      year as number,
      sort,
      cursor,
      Number(limit),
    );

    return { data };
  }

  /**
   * 그룹 일별 기록 조회
   */
  @UseGuards(GroupRoleGuard)
  @GroupRoles(GroupRoleEnum.VIEWER)
  @Get(':groupId/archives/days')
  @ApiOperation({
    summary: '그룹 일별 아카이브 조회',
    description: '특정 월의 일별 기록 요약 목록을 조회합니다.',
  })
  @ApiParam({ name: 'groupId', description: '그룹 ID' })
  @ApiWrappedOkResponse({ type: GroupDayRecordResponseDto, isArray: true })
  async getDailyArchive(
    @Param('groupId') groupId: string,
    @Query() query: GetGroupDailyArchiveQueryDto,
  ) {
    const { year, month } = parseYearMonth(query.month);

    const data = await this.groupRecordService.getDailyArchive(
      groupId,
      year,
      month,
    );

    return { data };
  }

  /**
   * 그룹 월별 커버 이미지 조회
   */
  @UseGuards(GroupRoleGuard)
  @GroupRoles(GroupRoleEnum.VIEWER)
  @Get(':groupId/archives/monthcover')
  @ApiOperation({
    summary: '그룹 월별 커버 후보 이미지 조회',
    description: '특정 월의 모든 기록에서 사용된 이미지 목록을 조회합니다.',
  })
  @ApiParam({ name: 'groupId', description: '그룹 ID' })
  @ApiWrappedOkResponse({ type: GroupCoverCandidatesResponseDto })
  async getMonthImages(
    @Param('groupId') groupId: string,
    @Query() query: GetGroupMonthImagesQueryDto,
  ) {
    const { yearMonth, cursor, limit = 20 } = query;
    const { year, month } = parseYearMonth(yearMonth);

    const data = await this.groupRecordService.getMonthImages(
      groupId,
      year,
      month,
      cursor,
      Number(limit),
    );

    return { data };
  }

  /**
   * 그룹 커버 후보 조회 (New)
   */
  @UseGuards(GroupRoleGuard)
  @GroupRoles(GroupRoleEnum.VIEWER)
  @Get(':groupId/cover-candidates')
  @ApiOperation({
    summary: '그룹 커버 후보 조회',
    description:
      '그룹의 모든 기록에서 사용된 이미지 목록을 날짜별로 그룹화하여 조회합니다.',
  })
  @ApiParam({ name: 'groupId', description: '그룹 ID' })
  @ApiWrappedOkResponse({ type: GroupCoverCandidatesResponseDto })
  async getCoverCandidates(
    @Param('groupId') groupId: string,
    @Query() query: GetGroupCoverCandidatesQueryDto,
  ) {
    const { cursor, limit = 20 } = query;
    const data = await this.groupRecordService.getCoverCandidates(
      groupId,
      cursor,
      Number(limit),
    );

    return { data };
  }

  /**
   * 그룹의 기록이 있는 날짜 조회
   */
  @UseGuards(GroupRoleGuard)
  @GroupRoles(GroupRoleEnum.VIEWER)
  @Get(':groupId/archives/record-days')
  @ApiOperation({
    summary: '기록이 있는 날짜 조회',
    description: '특정 월 중 기록이 있는 날짜 목록을 조회합니다.',
  })
  @ApiParam({ name: 'groupId', description: '그룹 ID' })
  @ApiWrappedOkResponse({ type: String, isArray: true })
  async getRecordedDays(
    @Param('groupId') groupId: string,
    @Query() query: GetGroupDailyArchiveQueryDto,
  ) {
    const { year, month } = parseYearMonth(query.month);

    const data = await this.groupRecordService.getRecordedDays(
      groupId,
      year,
      month,
    );

    return { data };
  }
}
