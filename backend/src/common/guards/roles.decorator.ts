import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

/*
Controller에 정적 권한 선언

Guard가 Reflection으로 읽음
*/
