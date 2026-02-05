'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useSocketStore } from '@/store/useSocketStore';
import { groupMyRoleOptions } from '@/lib/api/group';
import { useNewPostDraft } from '@/hooks/useGrouprRecord';
import {
  GroupDraftListItem,
  GroupDraftListSnapshot,
} from '@/lib/types/recordCollaboration';
import { formatDotDateString } from '@/lib/date';
import { cn } from '@/lib/utils';
import { getErrorMessage } from '@/lib/utils/errorHandler';

interface GroupDraftListProps {
  groupId: string;
}

export default function GroupDraftList({ groupId }: GroupDraftListProps) {
  const router = useRouter();
  const { socket } = useSocketStore();
  const [drafts, setDrafts] = useState<GroupDraftListItem[]>([]);

  const { data: roleData } = useQuery({
    ...groupMyRoleOptions(groupId),
    enabled: !!groupId,
  });

  const isViewer = roleData?.role === 'VIEWER';
  const { refetch: getNewPostDraft } = useNewPostDraft(groupId);

  useEffect(() => {
    if (!socket || !groupId) return;

    const handleSnapshot = (payload: GroupDraftListSnapshot) => {
      if (payload.groupId !== groupId) return;
      setDrafts(payload.drafts);
    };

    const join = () => {
      socket.emit('JOIN_GROUP_DRAFTS', { groupId });
    };

    socket.on('GROUP_DRAFTS_SNAPSHOT', handleSnapshot);
    socket.on('connect', join);
    join();

    return () => {
      socket.off('GROUP_DRAFTS_SNAPSHOT', handleSnapshot);
      socket.off('connect', join);
      socket.emit('LEAVE_GROUP_DRAFTS', { groupId });
    };
  }, [socket, groupId]);

  const createDraftCount = useMemo(
    () => drafts.filter((draft) => draft.kind === 'CREATE').length,
    [drafts],
  );

  const canCreateDraft = !isViewer && createDraftCount < 5;

  const handleCreateDraft = async () => {
    if (!groupId) return;

    try {
      const result = await getNewPostDraft();
      if (result.error) {
        toast.error(getErrorMessage(result.error));
        return;
      }
      const redirectUrl = result.data?.redirectUrl;
      if (!redirectUrl) {
        toast.error('공동 기록을 시작할 수 없어요.');
        return;
      }
      router.push(redirectUrl);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  if (!groupId) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
            공동 작성 중
          </span>
          <span className="text-[11px] font-semibold text-gray-400">
            {drafts.length}개
          </span>
        </div>
        <button
          type="button"
          onClick={handleCreateDraft}
          disabled={!canCreateDraft}
          className={cn(
            'px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all',
            canCreateDraft
              ? 'text-white bg-itta-black hover:bg-itta-black/80 active:scale-95'
              : 'text-gray-300 bg-gray-200 cursor-not-allowed',
          )}
        >
          새 드래프트
        </button>
      </div>

      {drafts.length === 0 ? (
        <div className="px-4 py-6 rounded-2xl border border-dashed dark:bg-white/5 dark:border-white/10 bg-white border-gray-200">
          <p className="text-sm font-medium text-gray-400">
            열려 있는 공동 작성이 없어요.
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {drafts.map((draft) => {
            const title = draft.title?.trim() || '제목 없음';
            const createdAt = formatDotDateString(draft.createdAt);
            const updatedAt = formatDotDateString(draft.updatedAt);
            const kindLabel = draft.kind === 'CREATE' ? '공동 작성' : '공동 수정';

            return (
              <button
                key={draft.draftId}
                type="button"
                onClick={() =>
                  !isViewer &&
                  router.push(`/group/${groupId}/post/${draft.draftId}`)
                }
                disabled={isViewer}
                className={cn(
                  'w-full text-left rounded-2xl border p-4 shadow-sm transition-all',
                  'dark:bg-[#1E1E1E] dark:border-white/5 bg-white border-gray-100',
                  isViewer
                    ? 'opacity-60 cursor-not-allowed'
                    : 'hover:shadow-md active:scale-[0.99]',
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded-full text-[10px] font-bold',
                          draft.kind === 'CREATE'
                            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300'
                            : 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300',
                        )}
                      >
                        {kindLabel}
                      </span>
                      {draft.isPublishing && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400">
                          발행 중
                        </span>
                      )}
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-[15px] font-semibold truncate dark:text-white text-itta-black">
                        {title}
                      </h4>
                      <p className="text-[11px] text-gray-400">
                        작성 {createdAt} · 수정 {updatedAt}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-gray-500 shrink-0">
                    <Users className="w-3.5 h-3.5" />
                    {draft.participantCount}명
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
