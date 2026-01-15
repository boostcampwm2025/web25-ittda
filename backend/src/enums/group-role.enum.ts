export const GroupRoleEnum = {
  ADMIN: 'ADMIN',
  EDITOR: 'EDITOR',
  VIEWER: 'VIEWER',
} as const;

export type GroupRoleEnum = (typeof GroupRoleEnum)[keyof typeof GroupRoleEnum];
