import { InviteRole } from './group';

export interface GroupProfileCover {
  assetId: string;
  sourcePostId: string;
}

/**
 * 그룹 내 내 프로필 정보
 */
export interface GroupMemberProfileResponse {
  groupId: string;
  userId: string;
  name: string;
  nicknameInGroup: string;
  cover: GroupProfileCover | null;
  role: InviteRole;
  updatedAt: string;
}
