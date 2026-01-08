import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GROUP_ROLE_KEY } from './group-roles.decorator';
import { GroupService } from '../group.service';

import type { RequestWithUser } from '../group.type';
import type { MyJwtPayload } from '../../auth/auth.type';

@Injectable()
export class GroupRoleGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly groupService: GroupService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      GROUP_ROLE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) return true;

    const request: RequestWithUser = context
      .switchToHttp()
      .getRequest<RequestWithUser>();
    const user = request.user as unknown as MyJwtPayload;

    if (!user || typeof user !== 'object') {
      return false;
    }

    const userId = user.sub;
    const groupId = request.params.groupId;

    const member = await this.groupService.findMember(userId, groupId);

    if (!member) return false;

    return requiredRoles.includes(member.role);
  }
}
