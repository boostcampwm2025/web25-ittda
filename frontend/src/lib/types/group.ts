import { GroupActivityType } from '../constants/constants';

export interface GroupInfo {
  name: string;
  inviteCode: string;
  members: Member[];
}

export interface Member {
  id: number;
  name: string;
  avatar: string;
  role?: 'admin' | 'member';
}

export interface Group {
  groupName: string;
  nicknameInGroup: string;
  groupThumnail: string;
  members: Member[];
}

export type ActiveMember = Member & {
  recordId: string;
};

export interface LatestPost {
  postId: string;
  title: string;
  eventAt: string;
  placeName: string | null;
}

export interface GroupCover {
  assetId: string;
  width: number;
  height: number;
  mimeType: string;
}

export type GroupRoleType = 'ADMIN' | 'EDITOR' | 'VIEWER';

export const ROLE_MAP = {
  admin: 'ADMIN',
  editor: 'EDITOR',
  viewer: 'VIEWER',
} as const;

export interface GroupActivityActor {
  userId?: string | null;
  nickname?: string | null;
  groupNickname?: string | null;
  profileImageId?: string | null;
}

export interface GroupActivityItem {
  id: string;
  type: GroupActivityType;
  refId?: string | null;
  meta?: Record<string, unknown> | null;
  createdAt: string;
  actors: GroupActivityActor[];
}
