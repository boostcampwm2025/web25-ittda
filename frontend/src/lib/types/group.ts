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
  groupThumnail: string;
  members: Member[];
}
