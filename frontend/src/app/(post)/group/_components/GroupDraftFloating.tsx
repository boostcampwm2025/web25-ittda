'use client';

import { useEffect, useState, useMemo } from 'react';
import { Edit3, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { PopoverClose } from '@radix-ui/react-popover';

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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export default function GroupDraftFloatingButton({
  groupId,
}: {
  groupId: string;
}) {
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
    <div className="sticky bottom-20 sm:bottom-30 z-50 w-full flex justify-end pr-1 sm:pr-5 pointer-events-none">
      <div className="pointer-events-auto">
        <Popover>
          {/* 플로팅 버튼 */}
          <PopoverTrigger asChild>
            <button className="relative h-12 w-12 sm:h-13 sm:w-13 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95 bg-itta-black text-white">
              <Edit3 className="w-5 h-5" />
              {drafts.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-itta-point px-1.5 text-[10px] font-bold text-white ring-2 ring-white dark:ring-[#121212]">
                  {drafts.length}
                </span>
              )}
            </button>
          </PopoverTrigger>

          {/* 팝오버 패널 */}
          <PopoverContent
            align="end"
            side="top"
            sideOffset={12}
            className="w-70 sm:w-80 lg:w-100 max-h-90 sm:max-h-100 p-0 rounded-[24px] sm:rounded-[32px] overflow-hidden border-gray-100 dark:border-white/10 bg-white/95 dark:bg-[#1E1E1E]/95 shadow-2xl flex flex-col"
          >
            <div className="w-full flex justify-end items-center pr-3 pt-3">
              <PopoverClose className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full text-gray-500 transition-colors">
                <X className="w-4 h-4" />
              </PopoverClose>
            </div>
            {/* 상단 헤더 */}
            <div className="w-full p-4 sm:p-5 border-b dark:border-white/5 border-gray-50 flex items-center justify-between bg-white/80 dark:bg-[#1E1E1E]/80 backdrop-blur-md">
              <div className="flex justify-between items-center w-full">
                <div className="flex flex-col">
                  <h3 className="text-sm sm:text-base font-bold dark:text-white text-itta-black">
                    공동 작성 중
                  </h3>
                  <p className="text-[10px] sm:text-[11px] text-gray-400 font-medium">
                    실시간으로 편집 중인 기록들
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCreateDraft}
                    disabled={!canCreateDraft}
                    className={cn(
                      'px-3 py-1.5 rounded-full transition-all active:scale-95 text-xs font-semibold',
                      canCreateDraft
                        ? 'bg-itta-black text-white hover:bg-itta-black/80'
                        : 'bg-gray-100 text-gray-300 cursor-not-allowed',
                    )}
                  >
                    새 드래프트
                  </button>
                </div>
              </div>
            </div>

            {/* 스크롤 영역 */}
            <div className="flex-1 overflow-y-auto px-4 pt-2 pb-4 bg-transparent [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              <GroupDraftList
                groupId={groupId}
                drafts={drafts}
                isViewer={isViewer}
              />
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
