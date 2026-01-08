import { Controller, Post, Body, UseGuards, Req, Param } from '@nestjs/common';
import { GroupService } from './group.service';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { GroupRoleGuard } from './guards/group-roles.guard';
import { GroupRoles } from './guards/group-roles.decorator';
import { GroupRoleEnum } from '@/enums/group-role.enum';

import type { RequestWithUser } from './group.type';
import type { MyJwtPayload } from '../auth/auth.type';

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
  @GroupRoles('OWNER')
  @Post(':groupId/members')
  addMember(
    @Param('groupId') groupId: string,
    @Body('userId') userId: string,
    @Body('role') role: GroupRoleEnum.OWNER | GroupRoleEnum.EDITOR,
  ) {
    return this.groupService.addMember(groupId, userId, role);
  }
}
