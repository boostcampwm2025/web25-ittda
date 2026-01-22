import { useEffect, useState } from 'react';
import { useSocketStore } from '@/store/useSocketStore';
import { GroupRoleType } from '@/lib/types/group';

export interface PresenceMember {
  actorId: string;
  sessionId: string;
  displayName: string;
  permissionRole: GroupRoleType;
  lastSeenAt: string;
}

export interface PresenceSnapshot {
  sessionId: string;
  version: number;
  members: PresenceMember[];
}

export function useDraftPresence(draftId?: string) {
  const { socket, isConnected } = useSocketStore();
  const [members, setMembers] = useState<PresenceMember[]>([]);

  useEffect(() => {
    if (!socket || !isConnected || !draftId) return;

    // 드래프트 진입
    socket.emit('JOIN_DRAFT', { draftId });

    socket.on('PRESENCE_SNAPSHOT', (data) => {
      setMembers(data.members); // 초기 전체 목록
    });

    socket.on('PRESENCE_JOINED', (newMember) => {
      setMembers((prev) => [...prev, newMember]); // 새 유저 추가
    });

    socket.on('PRESENCE_LEFT', ({ sessionId }) => {
      setMembers((prev) => prev.filter((m) => m.sessionId !== sessionId)); // 나간 유저 제거
    });

    return () => {
      socket.off('PRESENCE_SNAPSHOT');
      socket.off('PRESENCE_JOINED');
      socket.off('PRESENCE_LEFT');
    };
  }, [socket, isConnected, draftId]);

  return { members };
}
