'use client';

import { Group } from '@/lib/types/group';
import { GroupMember } from '@/lib/types/groupResponse';
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';

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
  initialThumbnail: { assetId: string; postId: string };
  initialMembers: GroupMember[];
}

export function GroupEditProvider({
  children,
  initialName,
  initialMembers,
  initialThumbnail,
}: GroupEditProviderProps) {
  const [groupName, setGroupName] = useState(initialName);
  const [groupThumbnail, setGroupThumbnail] = useState<{
    assetId: string;
    postId: string;
  } | null>(initialThumbnail);
  const [members, setMembers] = useState<GroupMember[]>(initialMembers);

  // props 변경 시 state 업데이트
  useEffect(() => {
    setGroupName(initialName);
  }, [initialName]);

  useEffect(() => {
    setGroupThumbnail(initialThumbnail);
  }, [initialThumbnail, initialThumbnail.assetId, initialThumbnail.postId]);

  useEffect(() => {
    setMembers(initialMembers);
  }, [initialMembers]);

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
