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

export function useDraftPresence(draftId?: string, groupId?: string, isPublishingExternal?: boolean, initialVersion: number = 0) {
  const { socket, setSessionId } = useSocketStore();
  const [members, setMembers] = useState<PresenceMember[]>([]);
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const didLeaveRef = useRef(false);
  const isPublishingRef = useRef(false);
  const router = useRouter();
  // initialVersion은 부모 재렌더 시 바뀔 수 있으므로 ref로 항상 최신값 유지
  const initialVersionRef = useRef(initialVersion);
  useEffect(() => {
    initialVersionRef.current = initialVersion;
  }, [initialVersion]);

  // 외부에서 isPublishing이 true로 바뀌면 ref에 반영 (클로저 갱신 불필요)
  useEffect(() => {
    if (isPublishingExternal) {
      isPublishingRef.current = true;
    }
  }, [isPublishingExternal]);
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
    // 아직 연결되지 않은 상태에서 emit하면 socket.io 내부 버퍼에 쌓여
    // 이후 연결 시 JOIN_DRAFT보다 먼저 도착해 'draftId mismatch' 예외 발생
    if (!socket.connected) return;
    didLeaveRef.current = true;
    stopHeartbeat();
    socket.emit('LEAVE_DRAFT', { draftId });
  }, [socket, draftId, stopHeartbeat]);

  useEffect(() => {
    if (!socket || !draftId) return;
    // effect 재실행(소켓 재연결 포함)마다 didLeaveRef 초기화
    // — [draftId] 단독 effect로는 socket 변경 시 초기화 안 됨
    didLeaveRef.current = false;

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

        reconnectTimerRef.current = setTimeout(() => {
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
      // 재연결 성공 시 예약된 리로드 타이머 취소
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      // 연결 성공 시 횟수 초기화
      if (sessionStorage.getItem(RETRY_KEY)) {
        sessionStorage.removeItem(RETRY_KEY);
        toast.success('서버와 연결되었습니다.');
      }
      // 재연결(disconnect 후 reconnect) 시 JOIN_DRAFT 재전송.
      // isConnected를 deps에 넣어 effect를 재실행하면 최초 연결 시에도 cleanup이
      // 실행되어 불필요한 JOIN→LEAVE→JOIN 루프가 발생하므로, 여기서 처리한다.
      didLeaveRef.current = false;
      socket.emit('JOIN_DRAFT', { draftId });
      startHeartbeat();
    };

    const handlePublishStarted = ({ draftId: id }: { draftId: string }) => {
      if (id === draftId) isPublishingRef.current = true;
    };
    const handlePublished = () => {
      isPublishingRef.current = true;
    };
    const handleDisconnect = (reason: string) => {
      // 발행 중이거나 의도적인 끊김이면 무시
      if (isPublishingRef.current || reason === 'io client disconnect') return;
      handleConnectionFailure();
    };
    const handleConnectError = () => {
      if (isPublishingRef.current) return;
      handleConnectionFailure();
    };

    socket.on('DRAFT_PUBLISH_STARTED', handlePublishStarted);
    socket.on('DRAFT_PUBLISHED', handlePublished);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);
    socket.on('connect', handleConnectSuccess);

    // 현재 접속중인 멤버 상태 이벤트
    // socket.off(event) 콜백 없이 호출하면 다른 훅이 등록한 핸들러까지 제거되므로
    // 모든 핸들러를 명명 변수로 저장하고 socket.off(event, handler)로 제거해야 함
    const handlePresenceSnapshot = (data: PresenceSnapshot) => {
      setMembers(data.members); // 초기 전체 목록
      setSessionId(data.sessionId);

      // 서버 버전이 클라이언트 초기 버전보다 높으면 입장 시 편집 내용을 놓친 것
      // → reload해서 최신 상태로 동기화 (무한 루프 방지용 sessionStorage 플래그)
      const syncKey = `draft_synced_${draftId}`;
      if (
        typeof data.version === 'number' &&
        data.version > initialVersionRef.current &&
        !sessionStorage.getItem(syncKey)
      ) {
        sessionStorage.setItem(syncKey, '1');
        toast.info('다른 편집 내용을 불러오는 중입니다...', { duration: 1000 });
        setTimeout(() => window.location.reload(), 1000);
      } else if (typeof data.version === 'number' && data.version <= initialVersionRef.current) {
        sessionStorage.removeItem(syncKey);
      }
    };
    socket.on('PRESENCE_SNAPSHOT', handlePresenceSnapshot);

    // 새로 방에 들어왔을 때 브로드 캐스트
    const handlePresenceJoined = ({ member }: { member: PresenceMember }) => {
      setMembers((prev) => {
        //새로운 유저 추가
        if (prev.some((m) => m.sessionId === member.sessionId)) return prev;
        return [...prev, member];
      });
    };
    socket.on('PRESENCE_JOINED', handlePresenceJoined);

    // 나갔을 때 브로드 캐스트
    const handlePresenceLeft = ({ sessionId }: PresenceLeftPayload) => {
      setMembers((prev) => prev.filter((m) => m.sessionId !== sessionId)); // 나간 유저 제거
    };
    socket.on('PRESENCE_LEFT', handlePresenceLeft);

    const handlePresenceReplaced = ({ previousSessionId, sessionId }: PresenceReplacedPayload) => {
      setMembers((prev) =>
        prev.map((m) =>
          m.sessionId === previousSessionId ? { ...m, sessionId } : m,
        ),
      );
    };
    socket.on('PRESENCE_REPLACED', handlePresenceReplaced);

    const handleSessionReplaced = () => {
      toast.info('다른 기기/탭에서 접속하여 연결이 종료되었습니다.');
      stopHeartbeat();
      socket.disconnect();
      router.back();
    };
    socket.on('SESSION_REPLACED', handleSessionReplaced);
    const handleDraftInvalidated = ({
      draftId: invalidatedId,
      reason,
    }: {
      draftId?: string;
      reason?: string;
    }) => {
      if (invalidatedId && invalidatedId !== draftId) return;
      // 발행으로 인한 종료는 DRAFT_PUBLISHED에서 처리하므로 무시
      if (isPublishingRef.current) return;
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

    // 이벤트 핸들러 등록 완료 후 드래프트 진입.
    // 이미 연결된 상태(draftId 변경 등)면 즉시 전송.
    // 아직 연결 중이면 handleConnectSuccess(connect 이벤트)가 담당하므로 여기서는 보내지 않는다.
    // — socket.io 내부 버퍼링에 의존하면 handleConnectSuccess와 중복 전송됨.
    if (socket.connected) {
      socket.emit('JOIN_DRAFT', { draftId });
      startHeartbeat();
    }
    return () => {
      socket.off('DRAFT_PUBLISH_STARTED', handlePublishStarted);
      socket.off('DRAFT_PUBLISHED', handlePublished);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
      socket.off('connect', handleConnectSuccess);
      socket.off('PRESENCE_SNAPSHOT', handlePresenceSnapshot);
      socket.off('PRESENCE_JOINED', handlePresenceJoined);
      socket.off('PRESENCE_LEFT', handlePresenceLeft);
      socket.off('PRESENCE_REPLACED', handlePresenceReplaced);
      socket.off('SESSION_REPLACED', handleSessionReplaced);
      socket.off('DRAFT_INVALIDATED', handleDraftInvalidated);
      leaveDraft();
    };
  }, [
    socket,
    // isConnected를 deps에서 제거: 최초 연결 시 isConnected false→true 변경으로
    // effect가 재실행되면 cleanup(LEAVE_DRAFT) + 재실행(JOIN_DRAFT)이 반복 발생함.
    // 재연결 처리는 handleConnectSuccess(connect 이벤트)에서 담당.
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
