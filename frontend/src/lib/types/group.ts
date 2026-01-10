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

export type InviteRole = 'admin' | 'editor' | 'viewer';
