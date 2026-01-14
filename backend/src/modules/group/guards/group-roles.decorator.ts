import { SetMetadata } from '@nestjs/common';

export const GROUP_ROLE_KEY = 'groupRoles';
export const GroupRoles = (...roles: string[]) =>
  SetMetadata(GROUP_ROLE_KEY, roles);
