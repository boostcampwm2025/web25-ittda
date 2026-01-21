import {
  Controller,
  Patch,
  Param,
  Body,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { GroupRecordService } from './group-record.service';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { GroupRoleGuard } from './guards/group-roles.guard';
import { GroupRoles } from './guards/group-roles.decorator';
import { GroupRoleEnum } from '@/enums/group-role.enum';
import { UpdateGroupMonthCoverDto } from './dto/update-group-month-cover.dto';

@ApiTags('group-records')
@Controller({
  path: 'groups',
  version: '1',
})
@UseGuards(JwtAuthGuard)
export class GroupRecordController {
  constructor(private readonly groupRecordService: GroupRecordService) {}

  /**
   * 그룹 월별 커버 변경
   * PATCH /v1/groups/:groupId/archives/months/:yyyy_mm/cover
   */
  @UseGuards(GroupRoleGuard)
  @GroupRoles(GroupRoleEnum.EDITOR)
  @Patch(':groupId/archives/months/:yyyy_mm/cover')
  async updateMonthCover(
    @Param('groupId') groupId: string,
    @Param('yyyy_mm') yyyy_mm: string,
    @Body() body: UpdateGroupMonthCoverDto,
  ) {
    const { year, month } = this.parseYearMonth(yyyy_mm);

    const result = await this.groupRecordService.updateMonthCover(
      groupId,
      year,
      month,
      body.coverAssetId,
    );

    return { data: result };
  }

  /**
   * YYYY-MM 형식의 문자열을 year, month로 파싱
   */
  private parseYearMonth(yyyy_mm: string) {
    const [yearStr, monthStr] = yyyy_mm.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);

    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      throw new BadRequestException('Invalid date format. Use YYYY-MM.');
    }

    return { year, month };
  }
}
