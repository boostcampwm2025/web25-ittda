import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/jwt/jwt.guard';
import { GroupRoleGuard } from '../guards/group-roles.guard';
import { GroupRoles } from '../guards/group-roles.decorator';
import { GroupRoleEnum } from '@/enums/group-role.enum';
import { GroupActivityService } from '../service/group-activity.service';
import { ApiWrappedOkResponse } from '@/common/swagger/api-wrapped-response.decorator';
import { PaginatedGroupActivityResponseDto } from '../dto/group-activity.dto';

@ApiTags('group-activities')
@ApiBearerAuth('bearerAuth')
@UseGuards(JwtAuthGuard, GroupRoleGuard)
@GroupRoles(GroupRoleEnum.VIEWER)
@Controller({ path: 'groups/:groupId/activities', version: '1' })
export class GroupActivityController {
  constructor(private readonly groupActivityService: GroupActivityService) {}

  @Get()
  @ApiOperation({ summary: '그룹 활동 로그 조회' })
  @ApiParam({ name: 'groupId', description: '그룹 ID' })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiWrappedOkResponse({ type: PaginatedGroupActivityResponseDto })
  getGroupActivities(
    @Param('groupId') groupId: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit: number = 20,
  ): Promise<PaginatedGroupActivityResponseDto> {
    return this.groupActivityService.getGroupActivities(
      groupId,
      cursor,
      Number(limit),
    );
  }
}
