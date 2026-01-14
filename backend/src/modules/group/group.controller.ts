import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
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

import type { RequestWithUser } from './group.type';
import type { MyJwtPayload } from '../auth/auth.type';
import { GroupRoleEnum } from '@/enums/group-role.enum';

@Controller({
  path: 'groups',
  version: '1',
})
export class GroupController {
  constructor(private readonly groupService: GroupService) {}

  /** 그룹 생성 (로그인 유저) */
  @UseGuards(JwtAuthGuard)
  @Post()
  createGroup(@Req() req: RequestWithUser, @Body('name') groupName: string) {
    const user = req.user as MyJwtPayload;
    const ownerId = user.sub;
    return this.groupService.createGroup(ownerId, groupName);
  }

  /** 멤버 초대 */
  @UseGuards(JwtAuthGuard, GroupRoleGuard)
  @GroupRoles(GroupRoleEnum.ADMIN)
  @Post(':groupId/members')
  addMember(@Param('groupId') groupId: string, @Body() dto: AddMemberDto) {
    return this.groupService.addMember(groupId, dto.userId, dto.role);
  }

  /** 멤버 권한 수정 */
  @UseGuards(JwtAuthGuard, GroupRoleGuard)
  @GroupRoles(GroupRoleEnum.ADMIN) // 관리자만 접근 가능
  @Patch(':groupId/members/:userId/role')
  async updateRole(
    @Req() req: RequestWithUser,
    @Param('groupId') groupId: string,
    @Param('userId') userId: string,
    @Body('role') newRole: GroupRoleEnum,
  ) {
    const requester = req.user as MyJwtPayload;
    const requesterId = requester.sub;

    return this.groupService.updateMemberRole(
      requesterId,
      groupId,
      userId,
      newRole,
    );
  }

  /** 그룹 삭제 (방장만 가능) */
  @UseGuards(JwtAuthGuard, GroupRoleGuard)
  @GroupRoles(GroupRoleEnum.ADMIN)
  @Delete(':groupId')
  async deleteGroup(
    @Req() req: RequestWithUser,
    @Param('groupId') groupId: string,
  ) {
    const user = req.user as MyJwtPayload;
    return this.groupService.deleteGroup(user.sub, groupId);
  }

  /** 그룹 정보 수정 */
  @UseGuards(JwtAuthGuard, GroupRoleGuard)
  @GroupRoles(GroupRoleEnum.ADMIN)
  @Patch(':groupId')
  async updateGroup(
    @Req() req: RequestWithUser,
    @Param('groupId') groupId: string,
    @Body() dto: UpdateGroupDto,
  ) {
    const user = req.user as MyJwtPayload;
    return this.groupService.updateGroup(user.sub, groupId, dto.name);
  }

  /** 그룹 나가기 (본인) */
  @UseGuards(JwtAuthGuard)
  @Delete(':groupId/members/me')
  async leaveGroup(
    @Req() req: RequestWithUser,
    @Param('groupId') groupId: string,
  ) {
    const user = req.user as MyJwtPayload;
    return this.groupService.leaveGroup(user.sub, groupId);
  }

  /** 멤버 추방 (관리자) */
  @UseGuards(JwtAuthGuard, GroupRoleGuard)
  @GroupRoles(GroupRoleEnum.ADMIN)
  @Delete(':groupId/members/:memberId')
  async removeMember(
    @Req() req: RequestWithUser,
    @Param('groupId') groupId: string,
    @Param('memberId') memberId: string,
  ) {
    const user = req.user as MyJwtPayload;
    return this.groupService.removeMember(user.sub, groupId, memberId);
  }

  /** 초대 링크 생성 */
  @UseGuards(JwtAuthGuard, GroupRoleGuard)
  @GroupRoles(GroupRoleEnum.ADMIN)
  @Post(':groupId/invites')
  async createInvite(
    @Req() req: RequestWithUser,
    @Param('groupId') groupId: string,
    @Body() dto: CreateInviteDto,
  ) {
    const user = req.user as MyJwtPayload;
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
  @UseGuards(JwtAuthGuard)
  @Post('invites/:code/join')
  async joinGroupViaInvite(
    @Req() req: RequestWithUser,
    @Param('code') code: string,
  ) {
    const user = req.user as MyJwtPayload;
    return this.groupService.joinGroupViaInvite(user.sub, code);
  }

  /** 초대 링크 삭제 (관리자, 하지만 inviteId로만 삭제하므로 그룹 권한 체크가 모호함.
   *  실제로는 inviteId로 그룹을 찾아서 권한 체크를 해야 하지만,
   *  여기서는 간단히 구현하거나, :groupId를 URL에 포함시키는 것이 좋음.
   *  요구사항: DELETE /v1/groups/{groupId}/invites/{inviteId}
   */
  @UseGuards(JwtAuthGuard, GroupRoleGuard)
  @GroupRoles(GroupRoleEnum.ADMIN)
  @Delete(':groupId/invites/:inviteId')
  async deleteInvite(
    @Param('groupId') groupId: string,
    @Param('inviteId') inviteId: string,
  ) {
    // GroupRoleGuard가 groupId로 권한 체크를 해줌
    await this.groupService.deleteInvite(inviteId);
    return { success: true };
  }
}
