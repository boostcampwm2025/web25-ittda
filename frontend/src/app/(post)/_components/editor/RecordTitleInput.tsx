'use client';
import { useMemo } from 'react';
import Image from 'next/image';
import { PresenceMember } from '@/hooks/useDraftPresence';
import { PatchApplyPayload } from '@/lib/types/recordCollaboration';
import { cn } from '@/lib/utils';
import AssetImage from '@/components/AssetImage';
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    setTitle(newVal);
  };

  const handleBlur = () => {
    if (draftId && isMyLock) {
      // 서버 커밋
      applyPatch({
        type: 'BLOCK_SET_TITLE',
        title: title,
      });
      // 락 해제
      lockManager.releaseLock(TITLE_LOCK_KEY);
    }
  };

  return (
    <div className="w-full flex flex-row gap-2 items-center group/title">
      {isLockedByOther && (
        <div
          onClick={() => toast.error('현재 다른 사용자가 편집 중입니다.')}
          className="absolute inset-0 z-20"
        />
      )}
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
