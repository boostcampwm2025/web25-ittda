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
import { GroupService } from './group.service';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { GroupRoleGuard } from './guards/group-roles.guard';
import { GroupRoles } from './guards/group-roles.decorator';
import { AddMemberDto } from './dto/add-member.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { CreateInviteDto } from './dto/create-invite.dto';

import { User } from '@/common/decorators/user.decorator';
import type { MyJwtPayload } from '../auth/auth.type';
import { GroupRoleEnum } from '@/enums/group-role.enum';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ApiWrappedOkResponse } from '@/common/swagger/api-wrapped-response.decorator';

@ApiTags('groups')
@ApiBearerAuth()
@Controller({
  path: 'groups',
  version: '1',
})
@UseGuards(JwtAuthGuard)
export class GroupController {
  constructor(private readonly groupService: GroupService) {}

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
  @Post(':groupId/members')
  @ApiOperation({
    summary: '멤버 추가',
    description: '관리자가 특정 유저를 그룹 멤버로 추가합니다.',
  })
  @ApiParam({ name: 'groupId', description: '그룹 ID' })
  @ApiWrappedOkResponse({ type: Object })
  addMember(@Param('groupId') groupId: string, @Body() dto: AddMemberDto) {
    return this.groupService.addMember(groupId, dto.userId, dto.role);
  }

  @UseGuards(GroupRoleGuard)
  @GroupRoles(GroupRoleEnum.ADMIN)
  @Patch(':groupId/members/:userId/role')
  @ApiOperation({
    summary: '멤버 권한 수정',
    description: '관리자가 특정 멤버의 권한을 수정합니다.',
  })
  @ApiParam({ name: 'groupId', description: '그룹 ID' })
  @ApiParam({ name: 'userId', description: '멤버의 유저 ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        role: {
          type: 'string',
          enum: [GroupRoleEnum.ADMIN, GroupRoleEnum.EDITOR],
          example: GroupRoleEnum.EDITOR,
        },
      },
    },
  })
  @ApiWrappedOkResponse({ type: Object })
  async updateRole(
    @User() user: MyJwtPayload,
    @Param('groupId') groupId: string,
    @Param('userId') userId: string,
    @Body('role') newRole: GroupRoleEnum,
  ) {
    const requesterId = user.sub;

    return this.groupService.updateMemberRole(
      requesterId,
      groupId,
      userId,
      newRole,
    );
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
  @ApiWrappedOkResponse({ type: Object })
  async updateGroup(
    @User() user: MyJwtPayload,
    @Param('groupId') groupId: string,
    @Body() dto: UpdateGroupDto,
  ) {
    return this.groupService.updateGroup(user.sub, groupId, dto.name);
  }

  @Delete(':groupId/members/me')
  @ApiOperation({
    summary: '그룹 나가기',
    description: '사용자 본인이 그룹에서 탈퇴합니다.',
  })
  @ApiParam({ name: 'groupId', description: '그룹 ID' })
  @ApiWrappedOkResponse({ type: Object })
  async leaveGroup(
    @User() user: MyJwtPayload,
    @Param('groupId') groupId: string,
  ) {
    return this.groupService.leaveGroup(user.sub, groupId);
  }

  @UseGuards(GroupRoleGuard)
  @GroupRoles(GroupRoleEnum.ADMIN)
  @Delete(':groupId/members/:memberId')
  @ApiOperation({
    summary: '멤버 추방',
    description: '관리자가 특정 멤버를 그룹에서 추방합니다.',
  })
  @ApiParam({ name: 'groupId', description: '그룹 ID' })
  @ApiParam({ name: 'memberId', description: '추방할 멤버의 ID' })
  @ApiWrappedOkResponse({ type: Object })
  async removeMember(
    @User() user: MyJwtPayload,
    @Param('groupId') groupId: string,
    @Param('memberId') memberId: string,
  ) {
    return this.groupService.removeMember(user.sub, groupId, memberId);
  }

  @UseGuards(GroupRoleGuard)
  @GroupRoles(GroupRoleEnum.ADMIN)
  @Post(':groupId/invites')
  @ApiOperation({
    summary: '초대 링크 생성',
    description: '관리자가 그룹에 초대할 수 있는 고유 링크 코드를 생성합니다.',
  })
  @ApiParam({ name: 'groupId', description: '그룹 ID' })
  @ApiWrappedOkResponse({ type: Object })
  async createInvite(
    @User() user: MyJwtPayload,
    @Param('groupId') groupId: string,
    @Body() dto: CreateInviteDto,
  ) {
    return this.groupService.createInvite(
      user.sub,
      groupId,
      dto.permission,
      dto.expiresInSeconds,
    );
  }

  @Get('invites/:code')
  @ApiOperation({
    summary: '초대 코드 정보 조회',
    description: '초대 코드의 유효성과 대상 그룹 정보를 확인합니다.',
  })
  @ApiParam({ name: 'code', description: '초대 코드' })
  @ApiWrappedOkResponse({ type: Object })
  async getInvite(@Param('code') code: string) {
    return this.groupService.getInvite(code);
  }

  @Post('invites/:code/join')
  @ApiOperation({
    summary: '초대 코드로 그룹 가입',
    description: '로그인한 사용자가 초대 코드를 사용하여 그룹에 가입합니다.',
  })
  @ApiParam({ name: 'code', description: '초대 코드' })
  @ApiWrappedOkResponse({ type: Object })
  async joinGroupViaInvite(
    @User() user: MyJwtPayload,
    @Param('code') code: string,
  ) {
    return this.groupService.joinGroupViaInvite(user.sub, code);
  }

  @UseGuards(GroupRoleGuard)
  @GroupRoles(GroupRoleEnum.ADMIN)
  @Delete(':groupId/invites/:inviteId')
  @ApiOperation({
    summary: '초대 링크 삭제',
    description: '관리자가 생성된 초대 링크를 비활성화(삭제)합니다.',
  })
  @ApiParam({ name: 'groupId', description: '그룹 ID' })
  @ApiParam({ name: 'inviteId', description: '초대 ID' })
  @ApiWrappedOkResponse({ type: Object })
  async deleteInvite(
    @Param('groupId') groupId: string,
    @Param('inviteId') inviteId: string,
  ) {
    await this.groupService.deleteInvite(inviteId);
    return;
  }
}
