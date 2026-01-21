'use client';

import { Group, Member } from '@/lib/types/group';
import { createContext, useContext, useState, ReactNode } from 'react';

interface GroupEditData {
  groupName: string;
  groupThumbnail: File | null;
  members: Member[];
}

type GroupEditContextType = GroupEditData & {
  setGroupName: (name: string) => void;
  setGroupThumbnail: (file: File | null) => void;
  setMembers: (members: Member[] | ((prev: Member[]) => Member[])) => void;
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
  initialMembers: Member[];
}

export function GroupEditProvider({
  children,
  initialName,
  initialMembers,
}: GroupEditProviderProps) {
  const [groupName, setGroupName] = useState(initialName);
  const [groupThumbnail, setGroupThumbnail] = useState<File | null>(null);
  const [members, setMembers] = useState<Member[]>(initialMembers);

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
