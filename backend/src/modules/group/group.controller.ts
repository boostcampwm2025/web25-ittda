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

@Controller({
  path: 'groups',
  version: '1',
})
@UseGuards(JwtAuthGuard)
export class GroupController {
  constructor(private readonly groupService: GroupService) {}

  /** 그룹 생성 (로그인 유저) */
  @Post()
  createGroup(@User() user: MyJwtPayload, @Body('name') groupName: string) {
    const ownerId = user.sub;
    return this.groupService.createGroup(ownerId, groupName);
  }

  /** 멤버 초대 */
  @UseGuards(GroupRoleGuard)
  @GroupRoles(GroupRoleEnum.ADMIN)
  @Post(':groupId/members')
  addMember(@Param('groupId') groupId: string, @Body() dto: AddMemberDto) {
    return this.groupService.addMember(groupId, dto.userId, dto.role);
  }

  /** 멤버 권한 수정 */
  @UseGuards(GroupRoleGuard)
  @GroupRoles(GroupRoleEnum.ADMIN) // 관리자만 접근 가능
  @Patch(':groupId/members/:userId/role')
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
  async updateGroup(
    @User() user: MyJwtPayload,
    @Param('groupId') groupId: string,
    @Body() dto: UpdateGroupDto,
  ) {
    return this.groupService.updateGroup(user.sub, groupId, dto.name);
  }

  /** 그룹 나가기 (본인) */
  @Delete(':groupId/members/me')
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

  /** 초대 링크 조회 (Public or Auth) - 여기서는 누구나 조회 가능하게 함 */
  @Get('invites/:code')
  async getInvite(@Param('code') code: string) {
    return this.groupService.getInvite(code);
  }

  /** 초대 링크로 가입 */
  @Post('invites/:code/join')
  async joinGroupViaInvite(
    @User() user: MyJwtPayload,
    @Param('code') code: string,
  ) {
    return this.groupService.joinGroupViaInvite(user.sub, code);
  }

  /** 초대 링크 삭제 (관리자, 하지만 inviteId로만 삭제하므로 그룹 권한 체크가 모호함.
   *  실제로는 inviteId로 그룹을 찾아서 권한 체크를 해야 하지만,
   *  여기서는 간단히 구현하거나, :groupId를 URL에 포함시키는 것이 좋음.
   *  요구사항: DELETE /v1/groups/{groupId}/invites/{inviteId}
   */
  @UseGuards(GroupRoleGuard)
  @GroupRoles(GroupRoleEnum.ADMIN)
  @Delete(':groupId/invites/:inviteId')
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
  async getGroupMembers(
    @Param('groupId') groupId: string,
  ): Promise<GetGroupMembersResponseDto> {
    return this.groupService.getGroupMembers(groupId);
  }
}
