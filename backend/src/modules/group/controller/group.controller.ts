// group.controller.ts: 그룹 목록 조회, 생성, 수정, 삭제
import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';
import { GroupService } from '../service/group.service';
import { JwtAuthGuard } from '../../auth/jwt/jwt.guard';
import { GroupRoleGuard } from '../guards/group-roles.guard';
import { GroupRoles } from '../guards/group-roles.decorator';
import { UpdateGroupDto } from '../dto/update-group.dto';
import { GetGroupsResponseDto } from '../dto/get-groups.dto';
import { User } from '@/common/decorators/user.decorator';
import { GroupRoleEnum } from '@/enums/group-role.enum';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ApiWrappedOkResponse } from '@/common/swagger/api-wrapped-response.decorator';

import type { MyJwtPayload } from '../../auth/auth.type';

@ApiTags('groups')
@ApiBearerAuth('bearerAuth')
@Controller({
  path: 'groups',
  version: '1',
})
@UseGuards(JwtAuthGuard)
export class GroupController {
  constructor(private readonly groupService: GroupService) {}

  @Get()
  @ApiOperation({
    summary: '그룹 목록 조회',
    description:
      '로그인한 사용자가 속한 그룹 목록을 조회합니다. (최신 활동 순)',
  })
  @ApiWrappedOkResponse({ type: GetGroupsResponseDto })
  async getGroups(@User() user: MyJwtPayload) {
    return this.groupService.getGroups(user.sub);
  }

  @Post()
  @ApiOperation({
    summary: '그룹 생성',
    description: '로그인한 사용자가 새로운 그룹을 생성합니다.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { name: { type: 'string', example: '새로운 그룹' } },
    },
  })
  @ApiWrappedOkResponse({ type: Object })
  createGroup(@User() user: MyJwtPayload, @Body('name') groupName: string) {
    const ownerId = user.sub;
    return this.groupService.createGroup(ownerId, groupName);
  }

  @UseGuards(GroupRoleGuard)
  @GroupRoles(GroupRoleEnum.ADMIN)
  @Delete(':groupId')
  @ApiOperation({
    summary: '그룹 삭제',
    description: '관리자(방장)가 그룹을 삭제합니다.',
  })
  @ApiParam({ name: 'groupId', description: '그룹 ID' })
  @ApiWrappedOkResponse({ type: Object })
  async deleteGroup(
    @User() user: MyJwtPayload,
    @Param('groupId') groupId: string,
  ) {
    return this.groupService.deleteGroup(user.sub, groupId);
  }

  @UseGuards(GroupRoleGuard)
  @GroupRoles(GroupRoleEnum.ADMIN)
  @Patch(':groupId')
  @ApiOperation({
    summary: '그룹 정보 수정',
    description: '관리자가 그룹의 이름을 수정합니다.',
  })
  @ApiParam({ name: 'groupId', description: '그룹 ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: '새로운 그룹' },
        version: { type: 'number', example: 0 },
      },
    },
  })
  @ApiWrappedOkResponse({ type: Object })
  async updateGroup(
    @User() user: MyJwtPayload,
    @Param('groupId') groupId: string,
    @Body() dto: UpdateGroupDto,
  ) {
    return this.groupService.updateGroup(
      user.sub,
      groupId,
      dto.name,
      dto.version,
    );
  }
}
