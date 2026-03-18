'use client';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import { PresenceMember } from '@/hooks/useDraftPresence';
import { PatchApplyPayload } from '@/lib/types/recordCollaboration';
import { cn } from '@/lib/utils';
import AssetImage from '@/components/AssetImage';
import { useThrottle } from '@/lib/utils/useThrottle';
import { useSocketStore } from '@/store/useSocketStore';
import { toast } from 'sonner';

interface RecordTitleInputProps {
  title: string;
  setTitle: (val: string) => void;
  draftId?: string;
  mySessionId?: string | null;
  members: PresenceMember[];
  applyPatch: (patch: PatchApplyPayload) => void;
  lockManager: {
    locks: Record<string, string>;
    requestLock: (lockKey: string) => void;
    releaseLock: (lockKey: string) => void;
  };
}

export default function RecordTitleInput({
  title,
  setTitle,
  draftId,
  mySessionId,
  members,
  applyPatch,
  lockManager,
}: RecordTitleInputProps) {
  const TITLE_LOCK_KEY = 'block:title';
  const { socket, sessionId: storeSessionId } = useSocketStore();
  const sessionId = mySessionId ?? storeSessionId;
  const inFlightRef = useRef(false);
  const pendingTitleRef = useRef<string | null>(null);
  const releaseAfterCommitRef = useRef(false);
  // LOCK_CHANGED가 비동기로 오기 때문에 isMyLock 대신 ref로 락 요청 여부를 동기 추적
  const hasRequestedLockRef = useRef(false);
  // 마지막으로 서버에 커밋된 제목 (변경 없는 blur 시 불필요한 패치 방지)
  const lastCommittedTitleRef = useRef(title);

  // 락 상태 및 소유자
  const ownerSessionId = lockManager.locks[TITLE_LOCK_KEY];
  const isMyLock = !!ownerSessionId && ownerSessionId === mySessionId;

  // 다른 유저가 제목을 바꿔서 title prop이 외부에서 갱신되면 lastCommittedTitleRef도 동기화
  // (동기화 안 하면 focus→blur 시 변경이 없어도 hasChanged=true로 불필요한 패치 전송)
  useEffect(() => {
    if (!isMyLock && !hasRequestedLockRef.current) {
      lastCommittedTitleRef.current = title;
    }
  }, [title, isMyLock]);
  const lockOwner = useMemo(
    () => members.find((m) => m.sessionId === ownerSessionId),
    [members, ownerSessionId],
  );
  const isLockedByOther = !!ownerSessionId && !isMyLock;

  const handleFocus = () => {
    if (draftId && !isLockedByOther) {
      lockManager.requestLock(TITLE_LOCK_KEY);
      hasRequestedLockRef.current = true;
    }
  };

  const sendTitlePatch = useCallback(
    (newTitle: string) => {
      applyPatch({
        type: 'BLOCK_SET_TITLE',
        title: newTitle,
      });
      inFlightRef.current = true;
      lastCommittedTitleRef.current = newTitle;
    },
    [applyPatch],
  );

  const queueTitlePatch = useCallback(
    (newTitle: string) => {
      if (!draftId || !isMyLock) return;
      if (inFlightRef.current) {
        pendingTitleRef.current = newTitle;
        return;
      }
      sendTitlePatch(newTitle);
    },
    [draftId, isMyLock, sendTitlePatch],
  );

  const { throttled: throttledApplyPatch, flush: flushTitlePatch } = useThrottle(
    useCallback(
      (newTitle: string) => {
        queueTitlePatch(newTitle);
      },
      [queueTitlePatch], // React Compiler 대응: 모든 의존성 포함
    ),
    3000,
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    setTitle(newVal);

    if (isMyLock) {
      throttledApplyPatch(newVal);
    }
  };

  const handleBlur = () => {
    if (!draftId) return;

    // isMyLock은 LOCK_CHANGED가 도착해야 true가 되는 비동기 상태.
    // hasRequestedLockRef는 requestLock 호출 즉시 true가 되므로 빠른 focus→blur에서도 락 해제 보장.
    const shouldRelease = isMyLock || hasRequestedLockRef.current;
    if (!shouldRelease) return;

    hasRequestedLockRef.current = false;

    if (isMyLock) {
      // 대기 중인 쓰로틀링 업데이트를 먼저 실행 (isMyLock일 때만 유효)
      flushTitlePatch();
    }

    // isMyLock이 아직 false여도 requestLock을 보냈다면(hadRequested)
    // 서버는 이미 락을 부여했으므로 sendTitlePatch로 직접 최종 패치 전송.
    // queueTitlePatch는 isMyLock 체크로 스킵되므로 호출 불가.
    // 변경이 없으면 불필요한 버전 증가를 막기 위해 패치를 생략
    const hasChanged = title !== lastCommittedTitleRef.current;
    if (!inFlightRef.current) {
      if (hasChanged) {
        sendTitlePatch(title);
      }
    } else if (pendingTitleRef.current === null && hasChanged) {
      pendingTitleRef.current = title;
    }

    if (inFlightRef.current || pendingTitleRef.current !== null) {
      releaseAfterCommitRef.current = true;
      return;
    }

    lockManager.releaseLock(TITLE_LOCK_KEY);
  };

  useEffect(() => {
    if (!socket || !sessionId) return;

    const handleCommitted = ({
      patch,
      authorSessionId,
    }: {
      patch: PatchApplyPayload | PatchApplyPayload[];
      authorSessionId?: string;
    }) => {
      if (authorSessionId !== sessionId) return;
      const commands = Array.isArray(patch) ? patch : [patch];
      const hasTitlePatch = commands.some(
        (cmd) => cmd.type === 'BLOCK_SET_TITLE',
      );
      if (!hasTitlePatch) return;

      inFlightRef.current = false;
      if (pendingTitleRef.current !== null) {
        // isMyLock이 아직 false(LOCK_CHANGED 미도착)여도 락을 요청한 상태이므로 전송
        const nextTitle = pendingTitleRef.current;
        pendingTitleRef.current = null;
        sendTitlePatch(nextTitle);
        return;
      }
      if (releaseAfterCommitRef.current) {
        lockManager.releaseLock(TITLE_LOCK_KEY);
        releaseAfterCommitRef.current = false;
      }
    };

    socket.on('PATCH_COMMITTED', handleCommitted);
    return () => {
      socket.off('PATCH_COMMITTED', handleCommitted);
    };
  }, [socket, sessionId, isMyLock, lockManager, sendTitlePatch]);

  return (
    <div className="w-full flex flex-row gap-2 items-center group/title">
      {isLockedByOther && (
        <div
          onClick={() => toast.error('현재 다른 사용자가 편집 중입니다.', { id: 'title-locked' })}
          className="absolute inset-0 z-20"
        />
      )}
      {isLockedByOther && lockOwner && (
        <div className="w-6 h-6 rounded-full ring-2 ring-itta-point animate-pulse overflow-hidden shrink-0">
          {lockOwner.profileImageId ? (
            <AssetImage
              assetId={lockOwner.profileImageId}
              alt={`${lockOwner.displayName} 편집 중`}
              width={24}
              height={24}
              className="w-full h-full rounded-full object-cover"
              title={lockOwner.displayName}
            />
          ) : (
            <Image
              width={24}
              height={24}
              src="/profile_base.png"
              alt={`${lockOwner.displayName} 편집 중`}
              className="w-full h-full rounded-full object-cover"
            />
          )}
        </div>
      )}

      <input
        type="text"
        placeholder="제목을 입력하세요"
        value={title}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        disabled={isLockedByOther}
        className={cn(
          'w-full border-none focus:ring-0 outline-none text-lg sm:text-xl font-semibold tracking-tight bg-transparent p-0 transition-colors',
          'placeholder-gray-200 dark:placeholder-gray-500',
          isLockedByOther
            ? 'text-gray-400 cursor-not-allowed'
            : 'text-itta-black dark:text-white',
        )}
      />
    </div>
  );
}
