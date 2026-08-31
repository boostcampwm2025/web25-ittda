'use client';

import { useRouter } from 'next/navigation';
import { Users } from 'lucide-react';
import { GroupDraftListItem } from '@/lib/types/recordCollaboration';
import { formatDotDateString } from '@/lib/date';
import { cn } from '@/lib/utils';

interface GroupDraftListProps {
  groupId: string;
  drafts: GroupDraftListItem[];
  isViewer: boolean;
}

export default function GroupDraftList({
  groupId,
  drafts,
  isViewer,
}: GroupDraftListProps) {
  const router = useRouter();

  if (!groupId) return null;

  const getDraftUrl = (draft: GroupDraftListItem) => {
    const baseUrl = `/group/${groupId}/post/${draft.draftId}`;

    // 수정 모드일 경우 쿼리 파라미터 추가
    if (draft.kind === 'EDIT' && draft.targetPostId) {
      return `${baseUrl}?mode=edit&postId=${draft.targetPostId}`;
    }

    return baseUrl;
  };

  return (
    <section className="space-y-3">
      {drafts.length === 0 ? (
        <div className="px-4 py-8 rounded-2xl border border-dashed dark:bg-white/5 dark:border-white/10 border-gray-100 text-center">
          <p className="text-xs font-medium text-gray-400">
            열려 있는 공동 작성이 없어요.
          </p>
        </div>
      ) : (
        <div className="grid gap-2.5">
          {drafts.map((draft) => {
            const title = draft.title?.trim() || '제목 없음';
            const createdAt = formatDotDateString(draft.createdAt);
            const updatedAt = formatDotDateString(draft.updatedAt);
            return (
              <button
                key={draft.draftId}
                type="button"
                onClick={() => !isViewer && router.push(getDraftUrl(draft))}
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
                            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10'
                            : 'bg-amber-50 text-amber-600 dark:bg-amber-500/10',
                        )}
                      >
                        {draft.kind === 'CREATE' ? '공동 작성' : '공동 수정'}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-[14px] font-bold truncate dark:text-white text-itta-black">
                        {title}
                      </h4>
                      <p className="text-[10px] text-gray-400">
                        작성 {createdAt} · 수정 {updatedAt}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400 shrink-0">
                    <Users className="w-3 h-3" />
                    {draft.participantCount}
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
