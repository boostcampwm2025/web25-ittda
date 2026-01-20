import { GroupRoleType } from './group';

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
  role: GroupRoleType;
  updatedAt: string;
}

/**
 * 그룹 정보 조회용
 * GroupMember, GoupDetail, GroupEditResponse
 */

export interface GroupMember {
  userId: string;
  name: string;
  profileImage: { assetId: string } | null;
  role: GroupRoleType;
  nicknameInGroup: string;
  joinedAt: string;
}

export interface GroupDetail {
  groupId: string;
  name: string;
  createdAt: string;
  ownerUserId: string;
  cover: {
    assetId: string;
    sourcePostId: string;
  } | null;
}

export interface GroupEditResponse {
  group: GroupDetail;
  me: GroupMember;
  members: GroupMember[];
}
