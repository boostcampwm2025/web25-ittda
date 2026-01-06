export interface GroupInfo {
  name: string;
  inviteCode: string;
  members: Member[];
}

export interface Member {
  id: number;
  name: string;
  avatar: string;
}
