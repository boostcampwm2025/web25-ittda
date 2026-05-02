import { GroupRoleEnum } from '@/enums/group-role.enum';

export const GROUP_ROLE_PRIORITY: Record<GroupRoleEnum, number> = {
  VIEWER: 1,
  EDITOR: 2,
  ADMIN: 3,
};

type AdminTransferCandidate = {
  role: GroupRoleEnum;
  joinedAt: Date;
};

export function compareGroupRolePriority(
  left: GroupRoleEnum,
  right: GroupRoleEnum,
): number {
  return GROUP_ROLE_PRIORITY[left] - GROUP_ROLE_PRIORITY[right];
}

export function pickNextGroupAdmin<T extends AdminTransferCandidate>(
  members: T[],
): T | undefined {
  return [...members].sort((left, right) => {
    const roleGap = compareGroupRolePriority(right.role, left.role);

    if (roleGap !== 0) {
      return roleGap;
    }

    return left.joinedAt.getTime() - right.joinedAt.getTime();
  })[0];
}
