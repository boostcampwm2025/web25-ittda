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

/**
 * -------- 아래 3개는 초대코드를 통한 유저 가입 후 반환되는 응답 객체들 중 일부 -------
 */
//그룹 정보
export interface GroupInfo {
  id: string;
  name: string;
  coverMediaId: string | null;
  coverSourcePostId: string | null;
  lastActivityAt: string | null;
  createdAt: string;
}

// 유저 상세 정보
export interface UserInfo {
  id: string;
  email: string | null;
  nickname: string;
  provider: string; // 'kakao' | 'google'
  providerId: string;
  profileImageId: string | null;
  settings: Record<string, unknown>;
  createdAt: string;
  deletedAt: string | null;
}

/**
 * 초대 코드로 가입 시 반환되는 데이터
 **/
export interface InviteJoinResponse {
  id: string;
  groupId: string;
  userId: string;
  group: GroupInfo;
  user: UserInfo;
  role: GroupRoleType;
  nicknameInGroup: string;
  profileMediaId: string | null;
  lastReadAt: string | null;
  joinedAt: string;
}
