// import { Controller, Post, Body, UseGuards, Req, Param } from '@nestjs/common';

// import { GroupService } from './group.service';
// import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
// import { GroupRoleGuard } from './guards/group-roles.guard';
// import { GroupRoles } from './guards/group-roles.decorator';

// @Controller('groups')
// export class GroupController {
//   constructor(private readonly groupService: GroupService) {}

//   /** 그룹 생성 (로그인 유저) */
//   @UseGuards(JwtAuthGuard)
//   @Post()
//   createGroup(@Req() req, @Body('name') name: string) {
//     return this.groupService.createGroup(req.user, name);
//   }

//   /** 멤버 초대 (OWNER 전용) */
//   @UseGuards(JwtAuthGuard, GroupRoleGuard)
//   @GroupRoles('OWNER')
//   @Post(':groupId/members')
//   addMember(
//     @Param('groupId') groupId: string,
//     @Body('userId') userId: string,
//     @Body('role') role: 'EDITOR' | 'VIEWER',
//   ) {
//     // userId → User 엔티티 조회는 UserService에서 처리 권장
//     return this.groupService.addMember(groupId, { id: userId } as any, role);
//   }
// }
