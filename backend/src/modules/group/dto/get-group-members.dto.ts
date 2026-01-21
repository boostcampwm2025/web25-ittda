export class GroupMemberResponseDto {
  memberId: string;
  profileImageId?: string | null;
}

export class GetGroupMembersResponseDto {
  groupName: string;
  groupMemberCount: number;
  members: GroupMemberResponseDto[];
}
