import {
  Controller,
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
}
