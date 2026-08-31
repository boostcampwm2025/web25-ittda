import { useEffect, useCallback, useRef } from 'react';
import { useSocketStore } from '@/store/useSocketStore';
import { toast } from 'sonner';

export interface LockRequestPayload {
  draftId: string;
  lockKey: string;
}

export interface LockResponsePayload {
  lockKey: string;
  ownerSessionId?: string;
}

export function useLockManager(draftId?: string, onLockDenied?: (lockKey: string) => void) {
  const { socket, sessionId: mySessionId } = useSocketStore();
  const pendingLockRef = useRef<string | null>(null);
  const activeLockKeys = useRef<Set<string>>(new Set());
  const heartbeatRefs = useRef<Record<string, NodeJS.Timeout>>({});

  // 락 획득 요청
  const requestLock = useCallback(
    (lockKey: string) => {
      if (!socket || !draftId) return;
      // 이미 보유 중이거나 대기 중인 락은 재요청하지 않음
      // (재포커스 시 중복 LOCK_ACQUIRE → LOCK_DENIED → 스퓨리어스 토스트 방지)
      if (activeLockKeys.current.has(lockKey)) return;
      activeLockKeys.current.add(lockKey);
      pendingLockRef.current = lockKey;
      socket.emit('LOCK_ACQUIRE', { draftId, lockKey });
    },
    [socket, draftId],
  );

  const stopHeartbeat = useCallback((lockKey: string) => {
    if (heartbeatRefs.current[lockKey]) {
      clearInterval(heartbeatRefs.current[lockKey]);
      delete heartbeatRefs.current[lockKey];
    }
  }, []);

  // 락 해제 요청
  const releaseLock = useCallback(
    (lockKey: string) => {
      if (!socket || !draftId) return;
      activeLockKeys.current.delete(lockKey);
      socket.emit('LOCK_RELEASE', { draftId, lockKey });

      stopHeartbeat(lockKey);
    },
    [socket, draftId, stopHeartbeat],
  );

  // 하트비트
  const startHeartbeat = useCallback(
    (lockKey: string) => {
      if (!activeLockKeys.current.has(lockKey)) return;
      if (heartbeatRefs.current[lockKey]) return;
      heartbeatRefs.current[lockKey] = setInterval(() => {
        if (socket?.connected) {
          socket.emit('LOCK_HEARTBEAT', { draftId, lockKey });
        } else {
          stopHeartbeat(lockKey); // 연결 끊기면 중단
        }
      }, 5_000);
    },
    [socket, draftId, stopHeartbeat],
  );

  useEffect(() => {
    if (!socket) return;
    const currentKeys = activeLockKeys.current;
    const currentHeartbeats = heartbeatRefs.current;

    // 성공 시 하트비트 시작
    const handleLockGranted = ({ lockKey }: LockResponsePayload) => {
      if (pendingLockRef.current === lockKey) {
        pendingLockRef.current = null;
      }

      // 이미 해제된 락(activeLockKeys에서 제거된 상태)이면 하트비트 시작하지 않음
      // 여러 락을 빠르게 요청할 때 pendingLockRef가 덮어써진 경우,
      // 뒤늦게 도착한 LOCK_GRANTED가 이미 해제된 락을 되살리는 것을 방지
      if (activeLockKeys.current.has(lockKey)) {
        startHeartbeat(lockKey);
      } else {
        // 이미 해제됐으므로 서버에도 즉시 해제 요청
        socket.emit('LOCK_RELEASE', { draftId, lockKey });
      }
    };
    socket.on('LOCK_GRANTED', handleLockGranted);

    // 거절 시 처리
    const handleLockDenied = ({ lockKey }: LockResponsePayload) => {
      const wasPending = pendingLockRef.current === lockKey;
      const wasActive = activeLockKeys.current.has(lockKey);

      if (wasPending) pendingLockRef.current = null;
      activeLockKeys.current.delete(lockKey);

      // 내가 요청한 락에 대한 거절만 처리
      // (서버가 room 전체에 broadcast하는 경우 요청하지 않은 클라이언트는 무시)
      if (!wasPending && !wasActive) return;

      onLockDenied?.(lockKey);
      // id 지정으로 같은 락 키의 toast 중복 생성 방지
      toast.error('다른 사용자가 편집 중입니다.', { id: `lock-denied-${lockKey}` });
    };
    socket.on('LOCK_DENIED', handleLockDenied);

    // 만료 시 처리
    const handleLockExpired = ({ lockKey, ownerSessionId }: LockResponsePayload) => {
      if (ownerSessionId === mySessionId) {
        stopHeartbeat(lockKey);
        // activeLockKeys에서 제거 — 남아있으면 unmount 시 만료된 락에 불필요한 LOCK_RELEASE 전송
        activeLockKeys.current.delete(lockKey);
        toast.warning('편집 시간이 만료되어 락이 해제되었습니다.');
      }
    };
    socket.on('LOCK_EXPIRED', handleLockExpired);

    return () => {
      socket.off('LOCK_GRANTED', handleLockGranted);
      socket.off('LOCK_DENIED', handleLockDenied);
      socket.off('LOCK_EXPIRED', handleLockExpired);
      // LOCK_ACQUIRE를 보냈지만 LOCK_GRANTED가 아직 안 온 대기 중인 락도 해제
      if (pendingLockRef.current && !currentKeys.has(pendingLockRef.current)) {
        socket.emit('LOCK_RELEASE', { draftId, lockKey: pendingLockRef.current });
        pendingLockRef.current = null;
      }
      currentKeys.forEach((lockKey) => {
        socket.emit('LOCK_RELEASE', { draftId, lockKey });
        if (currentHeartbeats[lockKey]) {
          clearInterval(currentHeartbeats[lockKey]);
        }
      });
      currentKeys.clear();
      heartbeatRefs.current = {};
    };
  }, [socket, startHeartbeat, stopHeartbeat, mySessionId, draftId, onLockDenied]);

  // 새 필드 포커스 시 기존 활성 락을 모두 먼저 해제하고 새 락을 획득.
  // 모바일(iOS Capacitor)에서 textarea → input 전환 시 blur 이벤트가 누락되어
  // 이전 락이 해제되지 않는 문제를 방어적으로 처리.
  const acquireExclusiveLock = useCallback(
    (lockKey: string) => {
      if (!socket || !draftId) return;

      // 다른 활성 락 먼저 해제 (blur 미발생으로 인한 락 누적 방지)
      Array.from(activeLockKeys.current).forEach((existingKey) => {
        if (existingKey !== lockKey) {
          socket.emit('LOCK_RELEASE', { draftId, lockKey: existingKey });
          stopHeartbeat(existingKey);
          activeLockKeys.current.delete(existingKey);
        }
      });

      // 대기 중인 다른 락 요청도 취소
      if (pendingLockRef.current && pendingLockRef.current !== lockKey) {
        socket.emit('LOCK_RELEASE', { draftId, lockKey: pendingLockRef.current });
        pendingLockRef.current = null;
      }

      // 이미 보유 중이거나 대기 중인 락은 재요청하지 않음
      if (activeLockKeys.current.has(lockKey)) return;
      activeLockKeys.current.add(lockKey);
      pendingLockRef.current = lockKey;
      socket.emit('LOCK_ACQUIRE', { draftId, lockKey });
    },
    [socket, draftId, stopHeartbeat],
  );

  return { requestLock, releaseLock, acquireExclusiveLock };
}
