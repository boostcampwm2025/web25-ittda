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
import { GetGroupMembersResponseDto } from './dto/get-group-members.dto';

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

  /** 그룹 생성 (로그인 유저) */
  @Post()
  @ApiOperation({
    summary: '그룹 생성',
    description: '새로운 그룹을 생성합니다.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: '부스트캠프 25조' },
      },
      required: ['name'],
    },
  })
  @ApiWrappedOkResponse({ type: Object })
  createGroup(@User() user: MyJwtPayload, @Body('name') groupName: string) {
    const ownerId = user.sub;
    return this.groupService.createGroup(ownerId, groupName);
  }

  /** 멤버 초대 */
  @UseGuards(GroupRoleGuard)
  @GroupRoles(GroupRoleEnum.ADMIN)
  @Post(':groupId/members')
  @ApiOperation({
    summary: '멤버 직접 초대',
    description: '그룹 관리자가 특정 유저를 그룹 멤버로 직접 초대합니다.',
  })
  @ApiParam({ name: 'groupId', description: '그룹 ID' })
  @ApiWrappedOkResponse({ type: Object })
  addMember(@Param('groupId') groupId: string, @Body() dto: AddMemberDto) {
    return this.groupService.addMember(groupId, dto.userId, dto.role);
  }

  /** 멤버 권한 수정 */
  @UseGuards(GroupRoleGuard)
  @GroupRoles(GroupRoleEnum.ADMIN) // 관리자만 접근 가능
  @Patch(':groupId/members/:userId/role')
  @ApiOperation({
    summary: '멤버 권한 수정',
    description: '그룹 관리자가 다른 멤버의 권한을 수정합니다.',
  })
  @ApiParam({ name: 'groupId', description: '그룹 ID' })
  @ApiParam({ name: 'userId', description: '멤버의 유저 ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        role: {
          enum: Object.values(GroupRoleEnum),
          example: GroupRoleEnum.EDITOR,
        },
      },
      required: ['role'],
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

  /** 그룹 삭제 (방장만 가능) */
  @UseGuards(GroupRoleGuard)
  @GroupRoles(GroupRoleEnum.ADMIN)
  @Delete(':groupId')
  @ApiOperation({
    summary: '그룹 삭제',
    description: '그룹 관리자(방장)가 그룹을 삭제합니다.',
  })
  @ApiParam({ name: 'groupId', description: '그룹 ID' })
  @ApiWrappedOkResponse({ type: Object })
  async deleteGroup(
    @User() user: MyJwtPayload,
    @Param('groupId') groupId: string,
  ) {
    return this.groupService.deleteGroup(user.sub, groupId);
  }

  /** 그룹 정보 수정 */
  @UseGuards(GroupRoleGuard)
  @GroupRoles(GroupRoleEnum.ADMIN)
  @Patch(':groupId')
  @ApiOperation({
    summary: '그룹 정보 수정',
    description: '그룹 관리자가 그룹의 기본 정보(이름 등)를 수정합니다.',
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

  /** 그룹 나가기 (본인) */
  @Delete(':groupId/members/me')
  @ApiOperation({
    summary: '그룹 나가기',
    description: '본인이 속한 그룹에서 나갑니다.',
  })
  @ApiParam({ name: 'groupId', description: '그룹 ID' })
  @ApiWrappedOkResponse({ type: Object })
  async leaveGroup(
    @User() user: MyJwtPayload,
    @Param('groupId') groupId: string,
  ) {
    return this.groupService.leaveGroup(user.sub, groupId);
  }

  /** 멤버 추방 (관리자) */
  @UseGuards(GroupRoleGuard)
  @GroupRoles(GroupRoleEnum.ADMIN)
  @Delete(':groupId/members/:memberId')
  @ApiOperation({
    summary: '멤버 추방',
    description: '그룹 관리자가 특정 멤버를 그룹에서 추방합니다.',
  })
  @ApiParam({ name: 'groupId', description: '그룹 ID' })
  @ApiParam({ name: 'memberId', description: '추방할 멤버의 유저 ID' })
  @ApiWrappedOkResponse({ type: Object })
  async removeMember(
    @User() user: MyJwtPayload,
    @Param('groupId') groupId: string,
    @Param('memberId') memberId: string,
  ) {
    return this.groupService.removeMember(user.sub, groupId, memberId);
  }

  /** 초대 링크 생성 */
  @UseGuards(GroupRoleGuard)
  @GroupRoles(GroupRoleEnum.ADMIN)
  @Post(':groupId/invites')
  @ApiOperation({
    summary: '초대 링크 생성',
    description: '그룹 관리자가 새로운 초대 링크를 생성합니다.',
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

  /** 초대 링크 조회 */
  @Get('invites/:code')
  @ApiOperation({
    summary: '초대 링크 조회',
    description: '초대 코드를 통해 그룹 초대 정보를 조회합니다.',
  })
  @ApiParam({ name: 'code', description: '초대 코드' })
  @ApiWrappedOkResponse({ type: Object })
  async getInvite(@Param('code') code: string) {
    return this.groupService.getInvite(code);
  }

  /** 초대 링크로 가입 */
  @Post('invites/:code/join')
  @ApiOperation({
    summary: '초대 링크로 가입',
    description: '초대 코드를 사용하여 그룹에 가입합니다.',
  })
  @ApiParam({ name: 'code', description: '초대 코드' })
  @ApiWrappedOkResponse({ type: Object })
  async joinGroupViaInvite(
    @User() user: MyJwtPayload,
    @Param('code') code: string,
  ) {
    return this.groupService.joinGroupViaInvite(user.sub, code);
  }

  /** 초대 링크 삭제 (관리자) */
  @UseGuards(GroupRoleGuard)
  @GroupRoles(GroupRoleEnum.ADMIN)
  @Delete(':groupId/invites/:inviteId')
  @ApiOperation({
    summary: '초대 링크 삭제',
    description: '그룹 관리자가 특정 초대 링크를 삭제합니다.',
  })
  @ApiParam({ name: 'groupId', description: '그룹 ID' })
  @ApiParam({ name: 'inviteId', description: '초대 ID' })
  @ApiWrappedOkResponse({ type: Object })
  async deleteInvite(
    @Param('groupId') groupId: string,
    @Param('inviteId') inviteId: string,
  ) {
    // GroupRoleGuard가 groupId로 권한 체크를 해줌
    await this.groupService.deleteInvite(inviteId);
    return;
  }

  /** 그룹 멤버 조회 */
  @Get(':groupId/current-members')
  @ApiOperation({
    summary: '그룹 멤버 목록 조회',
    description: '현재 그룹에 속한 멤버들의 정보를 조회합니다.',
  })
  @ApiParam({ name: 'groupId', description: '그룹 ID' })
  @ApiWrappedOkResponse({ type: GetGroupMembersResponseDto })
  async getGroupMembers(
    @Param('groupId') groupId: string,
  ): Promise<GetGroupMembersResponseDto> {
    return this.groupService.getGroupMembers(groupId);
  }
}
