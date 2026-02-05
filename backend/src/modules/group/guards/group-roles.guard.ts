import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GROUP_ROLE_KEY } from './group-roles.decorator';
import { GroupService } from '../service/group.service';
import { GroupRoleEnum } from '@/enums/group-role.enum';

import type { Request } from 'express';
import type { MyJwtPayload } from '../../auth/auth.type';

type RequestWithUser = Request & { user?: MyJwtPayload };

// 역할 우선순위 정의
const rolePriority: Record<GroupRoleEnum, number> = {
  VIEWER: 1,
  EDITOR: 2,
  ADMIN: 3,
};

@Injectable()
export class GroupRoleGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly groupService: GroupService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<GroupRoleEnum[]>(
      GROUP_ROLE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) return true;

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;
    if (!user || typeof user !== 'object') return false;

    const userId = user.sub;
    const groupId = request.params.groupId;

    const member = await this.groupService.findMember(userId, groupId);
    if (!member) return false;

    // 최소 요구되는 역할 중 하나라도 만족하면 true
    return requiredRoles.some(
      (required) => rolePriority[member.role] >= rolePriority[required],
    );
  }
}
