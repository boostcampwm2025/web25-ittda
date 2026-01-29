import { useCallback, useEffect, useRef, useState } from 'react';
import { useSocketStore } from '@/store/useSocketStore';
import { GroupRoleType } from '@/lib/types/group';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

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

export interface PresenceJoinedPayload {
  member: PresenceMember;
}

export interface PresenceLeftPayload {
  sessionId: string;
}

export interface PresenceReplacedPayload {
  previousSessionId: string;
  sessionId: string;
}

export function useDraftPresence(draftId?: string) {
  const { socket, isConnected, setSessionId } = useSocketStore();
  const [members, setMembers] = useState<PresenceMember[]>([]);
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  // 하트비트 정지
  const stopHeartbeat = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
  }, []);

  // 하트비트 시작
  const startHeartbeat = useCallback(() => {
    stopHeartbeat();

    heartbeatRef.current = setInterval(() => {
      if (socket?.connected) {
        socket.emit('PRESENCE_HEARTBEAT', { draftId });
      }
    }, 50_000); // 50초 간격
  }, [socket, draftId, stopHeartbeat]);

  useEffect(() => {
    if (!socket || !isConnected || !draftId) return;

    // 현재 접속중인 멤버 상태 이벤트
    socket.on('PRESENCE_SNAPSHOT', (data: PresenceSnapshot) => {
      setMembers(data.members); // 초기 전체 목록
      setSessionId(data.sessionId);
    });

    // 새로 방에 들어왔을 때 브로드 캐스트
    socket.on('PRESENCE_JOINED', ({ member }: { member: PresenceMember }) => {
      setMembers((prev) => {
        //새로운 유저 추가
        if (prev.some((m) => m.sessionId === member.sessionId)) return prev;
        return [...prev, member];
      });
    });

    // 나갔을 때 브로드 캐스트
    socket.on('PRESENCE_LEFT', ({ sessionId }: PresenceLeftPayload) => {
      setMembers((prev) => prev.filter((m) => m.sessionId !== sessionId)); // 나간 유저 제거
    });

    socket.on(
      'PRESENCE_REPLACED',
      ({ previousSessionId, sessionId }: PresenceReplacedPayload) => {
        setMembers((prev) =>
          prev.map((m) =>
            m.sessionId === previousSessionId ? { ...m, sessionId } : m,
          ),
        );
      },
    );
    socket.on('SESSION_REPLACED', () => {
      toast.info('다른 기기/탭에서 접속하여 연결이 종료되었습니다.');
      stopHeartbeat();
      socket.disconnect();
      router.push('/');
    });

    // 이벤트 연결 끝내고 드래프트 진입 및 하트비트 시작
    socket.emit('JOIN_DRAFT', { draftId });
    startHeartbeat();
    return () => {
      stopHeartbeat();
      socket.off('PRESENCE_SNAPSHOT');
      socket.off('PRESENCE_JOINED');
      socket.off('PRESENCE_LEFT');
      socket.off('PRESENCE_REPLACED');
      socket.off('SESSION_REPLACED');
      socket.emit('LEAVE_DRAFT', { draftId });
    };
  }, [
    socket,
    isConnected,
    draftId,
    setSessionId,
    router,
    startHeartbeat,
    stopHeartbeat,
  ]);

  return { members };
}
