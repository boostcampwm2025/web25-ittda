'use client';

import { useEffect, useState, useMemo } from 'react';
import { Edit3, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import GroupDraftList from './GroupDraftList';
import { cn } from '@/lib/utils';
import { useSocketStore } from '@/store/useSocketStore';
import { groupMyRoleOptions } from '@/lib/api/group';
import { useNewPostDraft } from '@/hooks/useGrouprRecord';
import {
  GroupDraftListItem,
  GroupDraftListSnapshot,
} from '@/lib/types/recordCollaboration';
import { getErrorMessage } from '@/lib/utils/errorHandler';

export default function GroupDraftFloatingButton({
  groupId,
}: {
  groupId: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const { socket } = useSocketStore();
  const [drafts, setDrafts] = useState<GroupDraftListItem[]>([]);

  // 1. 소켓 데이터 관리 (전역 상태 공유)
  useEffect(() => {
    if (!socket || !groupId) return;
    const handleSnapshot = (payload: GroupDraftListSnapshot) => {
      if (payload.groupId !== groupId) return;
      setDrafts(payload.drafts);
    };
    const join = () => socket.emit('JOIN_GROUP_DRAFTS', { groupId });
    socket.on('GROUP_DRAFTS_SNAPSHOT', handleSnapshot);
    socket.on('connect', join);
    join();
    return () => {
      socket.off('GROUP_DRAFTS_SNAPSHOT', handleSnapshot);
      socket.off('connect', join);
      socket.emit('LEAVE_GROUP_DRAFTS', { groupId });
    };
  }, [socket, groupId]);

  // 2. 권한 및 작성 로직 관리
  const { data: roleData } = useQuery({
    ...groupMyRoleOptions(groupId),
    enabled: !!groupId,
  });
  const isViewer = roleData?.role === 'VIEWER';
  const { refetch: getNewPostDraft } = useNewPostDraft(groupId);

  const createDraftCount = useMemo(
    () => drafts.filter((d) => d.kind === 'CREATE').length,
    [drafts],
  );
  const canCreateDraft = !isViewer && createDraftCount < 5;

  const handleCreateDraft = async () => {
    if (!groupId || !canCreateDraft) return;
    try {
      const result = await getNewPostDraft();
      if (result.error) return toast.error(getErrorMessage(result.error));
      if (result.data?.redirectUrl) router.push(result.data.redirectUrl);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <div className="fixed bottom-32 right-8 z-50 flex flex-col items-end gap-4">
      <div
        className={cn(
          'w-[320px] sm:w-100 max-h-100 overflow-hidden rounded-[32px] border shadow-2xl bg-white/95 dark:bg-[#1E1E1E]/95 border-gray-100 dark:border-white/10 flex flex-col transition-all duration-300 ease-out origin-bottom-right',
          isOpen
            ? 'opacity-100 scale-100 translate-y-0 visible'
            : 'opacity-0 scale-95 translate-y-4 invisible',
        )}
      >
        {/* 상단 헤더 */}
        <div className="sticky top-0 z-20 p-5 border-b dark:border-white/5 border-gray-50 flex items-center justify-between bg-white/80 dark:bg-[#1E1E1E]/80 backdrop-blur-md">
          <div className="flex flex-col">
            <h3 className="text-base font-bold dark:text-white text-itta-black">
              공동 작성 중
            </h3>
            <p className="text-[11px] text-gray-400 font-medium">
              실시간으로 편집 중인 기록들
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCreateDraft}
              disabled={!canCreateDraft}
              className={cn(
                'p-2 rounded-full transition-all active:scale-95 text-xs',
                canCreateDraft
                  ? 'bg-itta-black text-white hover:bg-itta-black/80'
                  : 'bg-gray-100 text-gray-300 cursor-not-allowed',
              )}
            >
              새 드래프트
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full text-gray-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 스크롤 영역 */}
        <div className="flex-1 overflow-y-auto px-4 pt-2 pb-4! bg-transparent [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <GroupDraftList
            groupId={groupId}
            drafts={drafts}
            isViewer={isViewer}
          />
        </div>
      </div>

      {/* 플로팅 버튼 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'relative group h-14 w-14 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95',
          isOpen
            ? 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-white'
            : 'bg-itta-black text-white',
        )}
      >
        {isOpen ? <X className="w-7 h-7" /> : <Edit3 className="w-6 h-6" />}
        {!isOpen && drafts.length > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-itta-point px-1.5 text-[10px] font-bold text-white ring-2 ring-white dark:ring-[#121212]">
            {drafts.length}
          </span>
        )}
      </button>
    </div>
  );
}
