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

export function useLockManager(draftId?: string) {
  const { socket, sessionId: mySessionId } = useSocketStore();
  const pendingLockRef = useRef<string | null>(null);
  const activeLockKeys = useRef<Set<string>>(new Set());
  const heartbeatRefs = useRef<Record<string, NodeJS.Timeout>>({});

  // 락 획득 요청
  const requestLock = useCallback(
    (lockKey: string) => {
      if (!socket || !draftId) return;
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
    socket.on('LOCK_GRANTED', ({ lockKey }: LockResponsePayload) => {
      if (pendingLockRef.current === lockKey) {
        pendingLockRef.current = null;
      } else {
        activeLockKeys.current.add(lockKey);
      }

      startHeartbeat(lockKey);
    });

    // 거절 시 처리
    socket.on('LOCK_DENIED', ({ lockKey }: LockResponsePayload) => {
      if (pendingLockRef.current === lockKey) pendingLockRef.current = null;
      activeLockKeys.current.delete(lockKey);
      toast.error('다른 사용자가 편집 중입니다.');
    });

    // 만료 시 처리
    socket.on(
      'LOCK_EXPIRED',
      ({ lockKey, ownerSessionId }: LockResponsePayload) => {
        if (ownerSessionId === mySessionId) {
          stopHeartbeat(lockKey);
          toast.warning('편집 시간이 만료되어 락이 해제되었습니다.');
        }
      },
    );

    return () => {
      socket.off('LOCK_GRANTED');
      socket.off('LOCK_DENIED');
      socket.off('LOCK_EXPIRED');
      currentKeys.forEach((lockKey) => {
        socket.emit('LOCK_RELEASE', { draftId, lockKey });
        if (currentHeartbeats[lockKey]) {
          clearInterval(currentHeartbeats[lockKey]);
        }
      });
      currentKeys.clear();
      heartbeatRefs.current = {};
    };
  }, [socket, startHeartbeat, stopHeartbeat, mySessionId, draftId]);

  return { requestLock, releaseLock };
}
