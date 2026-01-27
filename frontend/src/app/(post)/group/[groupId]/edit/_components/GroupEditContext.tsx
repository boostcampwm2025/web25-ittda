'use client';

import { Group } from '@/lib/types/group';
import { GroupMember } from '@/lib/types/groupResponse';
import { createContext, useContext, useState, ReactNode } from 'react';

interface GroupEditData {
  groupName: string;
  groupThumbnail: { assetId: string; postId: string } | null;
  members: GroupMember[];
}

type GroupEditContextType = GroupEditData & {
  setGroupName: (name: string) => void;
  setGroupThumbnail: ({
    assetId,
    postId,
  }: {
    assetId: string;
    postId: string;
  }) => void;
  setMembers: (
    members: GroupMember[] | ((prev: GroupMember[]) => GroupMember[]),
  ) => void;
  getEditData: () => GroupEditData;
};

const GroupEditContext = createContext<GroupEditContextType | null>(null);

export function useGroupEdit() {
  const context = useContext(GroupEditContext);
  if (!context) {
    throw new Error('useGroupEdit must be used within GroupEditProvider');
  }
  return context;
}

interface GroupEditProviderProps {
  children: ReactNode;
  initialName: Group['groupName'];
  initialThumbnail: Group['groupThumnail'];
  initialMembers: GroupMember[];
}

export function GroupEditProvider({
  children,
  initialName,
  initialMembers,
}: GroupEditProviderProps) {
  const [groupName, setGroupName] = useState(initialName);
  const [groupThumbnail, setGroupThumbnail] = useState<{
    assetId: string;
    postId: string;
  } | null>(null);
  const [members, setMembers] = useState<GroupMember[]>(initialMembers);

  const getEditData = (): GroupEditData => ({
    groupName,
    groupThumbnail,
    members,
  });

  return (
    <GroupEditContext.Provider
      value={{
        groupName,
        setGroupName,
        groupThumbnail,
        setGroupThumbnail,
        members,
        setMembers,
        getEditData,
      }}
    >
      {children}
    </GroupEditContext.Provider>
  );
}
