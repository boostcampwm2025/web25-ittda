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
  profileImageId?: string | null;
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

export function useDraftPresence(draftId?: string, groupId?: string) {
  const { socket, isConnected, setSessionId } = useSocketStore();
  const [members, setMembers] = useState<PresenceMember[]>([]);
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);
  const didLeaveRef = useRef(false);
  const router = useRouter();
  const MAX_RETRY_COUNT = 3;
  const RETRY_KEY = `socket_retry_${draftId || 'default'}`;
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

  const leaveDraft = useCallback(() => {
    if (!socket || !draftId || didLeaveRef.current) return;
    didLeaveRef.current = true;
    stopHeartbeat();
    socket.emit('LEAVE_DRAFT', { draftId });
  }, [socket, draftId, stopHeartbeat]);

  useEffect(() => {
    didLeaveRef.current = false;
  }, [draftId]);

  useEffect(() => {
    if (!socket || !draftId) return;

    const handleConnectionFailure = () => {
      const currentRetry = Number(sessionStorage.getItem(RETRY_KEY) || '0');

      if (currentRetry < MAX_RETRY_COUNT) {
        // 재시도
        sessionStorage.setItem(RETRY_KEY, (currentRetry + 1).toString());

        toast.error(
          `연결이 불안정합니다. 재연결을 시도합니다... (${currentRetry + 1}/${MAX_RETRY_COUNT})`,
          {
            description: '잠시 후 페이지가 새로고침됩니다.',
            duration: 2500,
          },
        );

        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        // 실패 -> 리다이렉트
        sessionStorage.removeItem(RETRY_KEY);
        toast.error('서버와의 연결을 복구할 수 없습니다.', {
          description: '작성 중인 데이터 보호를 위해 목록으로 이동합니다.',
          duration: 4000,
        });

        setTimeout(() => {
          router.push(groupId ? `/group/${groupId}` : '/');
        }, 3000);
      }
    };

    const handleConnectSuccess = () => {
      // 연결 성공 시 횟수 초기화
      if (sessionStorage.getItem(RETRY_KEY)) {
        sessionStorage.removeItem(RETRY_KEY);
        toast.success('서버와 연결되었습니다.');
      }
    };

    socket.on('disconnect', (reason) => {
      // 의도적인 끊김이 아닐 때만
      if (reason !== 'io client disconnect') {
        handleConnectionFailure();
      }
    });
    socket.on('connect_error', () => handleConnectionFailure());
    socket.on('connect', handleConnectSuccess);

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
      router.back();
    });
    const handleDraftInvalidated = ({
      draftId: invalidatedId,
      reason,
    }: {
      draftId?: string;
      reason?: string;
    }) => {
      if (invalidatedId && invalidatedId !== draftId) return;
      if (reason === 'POST_DELETED') {
        toast.error('게시글이 삭제되어 드래프트가 종료되었습니다.');
      } else {
        toast.error('드래프트가 종료되었습니다.');
      }
      leaveDraft();
      setTimeout(() => {
        router.replace(groupId ? `/group/${groupId}` : '/');
      }, 500);
    };
    socket.on('DRAFT_INVALIDATED', handleDraftInvalidated);

    // 이벤트 연결 끝내고 드래프트 진입 및 하트비트 시작
    socket.emit('JOIN_DRAFT', { draftId });
    startHeartbeat();
    return () => {
      socket.off('PRESENCE_SNAPSHOT');
      socket.off('PRESENCE_JOINED');
      socket.off('PRESENCE_LEFT');
      socket.off('PRESENCE_REPLACED');
      socket.off('SESSION_REPLACED');
      socket.off('DRAFT_INVALIDATED', handleDraftInvalidated);
      leaveDraft();
    };
  }, [
    socket,
    isConnected,
    draftId,
    setSessionId,
    router,
    startHeartbeat,
    stopHeartbeat,
    RETRY_KEY,
    groupId,
    leaveDraft,
  ]);

  return { members };
}
