'use client';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import { PresenceMember } from '@/hooks/useDraftPresence';
import { PatchApplyPayload } from '@/lib/types/recordCollaboration';
import { cn } from '@/lib/utils';
import AssetImage from '@/components/AssetImage';
import { useThrottle } from '@/lib/utils/useThrottle';
import { useSocketStore } from '@/store/useSocketStore';

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

  // 락 상태 및 소유자
  const ownerSessionId = lockManager.locks[TITLE_LOCK_KEY];
  const isMyLock = !!ownerSessionId && ownerSessionId === mySessionId;
  const lockOwner = useMemo(
    () => members.find((m) => m.sessionId === ownerSessionId),
    [members, ownerSessionId],
  );
  const isLockedByOther = !!ownerSessionId && !isMyLock;

  const handleFocus = () => {
    if (draftId && !isLockedByOther) {
      lockManager.requestLock(TITLE_LOCK_KEY);
    }
  };

  const sendTitlePatch = useCallback(
    (newTitle: string) => {
      applyPatch({
        type: 'BLOCK_SET_TITLE',
        title: newTitle,
      });
      inFlightRef.current = true;
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
    if (draftId && isMyLock) {
      // 대기 중인 쓰로틀링 업데이트를 먼저 실행
      flushTitlePatch();
      // 서버 커밋
      queueTitlePatch(title);
      if (inFlightRef.current || pendingTitleRef.current !== null) {
        releaseAfterCommitRef.current = true;
        return;
      }
      lockManager.releaseLock(TITLE_LOCK_KEY);
    }
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
      if (pendingTitleRef.current !== null && isMyLock) {
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
      {isLockedByOther && lockOwner && (
        <div className="shrink-0">
          {lockOwner.profileImageId ? (
            <AssetImage
              assetId={lockOwner.profileImageId}
              alt={`${lockOwner.displayName} 편집 중`}
              width={32}
              height={32}
              className="w-8 h-8 rounded-full ring-2 ring-itta-point animate-pulse object-cover"
              title={lockOwner.displayName}
            />
          ) : (
            <Image
              width={32}
              height={32}
              src="/profile_base.png"
              alt={`${lockOwner.displayName} 편집 중`}
              className="w-8 h-8 rounded-full ring-2 ring-itta-point animate-pulse"
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
          'w-full border-none focus:ring-0 outline-none text-xl font-semibold tracking-tight bg-transparent p-0 transition-colors',
          'placeholder-gray-200 dark:placeholder-gray-500',
          isLockedByOther
            ? 'text-gray-400 cursor-not-allowed'
            : 'text-itta-black dark:text-white',
        )}
      />
    </div>
  );
}
