'use client';

import { useRouter } from 'next/navigation';
import { ChevronRight, User, Users, X } from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerClose,
} from '@/components/ui/drawer';
import { cn } from '@/lib/utils';
import { useNewPostDraft } from '@/hooks/useGrouprRecord';
import * as Sentry from '@sentry/nextjs';
import { logger } from '@/lib/utils/logger';

interface AddRecordDrawerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  groupId?: string;
}

export function AddRecordDrawer({
  isOpen,
  onOpenChange,
  groupId,
}: AddRecordDrawerProps) {
  const router = useRouter();
  const { refetch: getNewPostDraft, isFetching } = useNewPostDraft(
    groupId || '',
  );

  const handleGroupRecord = async () => {
    if (!groupId || isFetching) return;

    const { data: refetchedData, isError, error } = await getNewPostDraft();

    if (isError) {
      Sentry.captureException(error, {
        level: 'error',
        tags: { context: 'group', operation: 'create-group-record' },
        extra: { groupId },
      });
      logger.error('그룹 드래프트 생성 실패', error);
      return;
    }

    if (refetchedData?.redirectUrl) {
      onOpenChange(false);
      router.push(refetchedData.redirectUrl);
    } else {
      // 리다이렉트 URL 누락은 백엔드 응답 문제일 가능성
      const error = new Error(
        '공동 기록 생성 응답에 리다이렉트 URL이 없습니다',
      );
      Sentry.captureException(error, {
        level: 'warning',
        tags: {
          context: 'group',
          operation: 'create-group-record',
        },
        extra: {
          groupId,
          responseData: refetchedData,
        },
      });
      // console.warn('리다이렉트 URL이 없습니다.');
    }

    onOpenChange(false);
  };

  const handleIndividualRecord = () => {
    onOpenChange(false);
    // 위 handleGroupRecord와 같은 이유로 replace 대신 push 사용.
    router.push(`/add?groupId=${groupId}`);
  };

  return (
    <Drawer open={isOpen} onOpenChange={onOpenChange}>
      <DrawerContent className="px-6 pb-8 sm:pb-12">
        <div className="w-full">
          <div className="pt-5 pb-4 flex items-center justify-between">
            <DrawerTitle className="text-lg font-bold dark:text-white">
              기록 방식을 선택하세요
            </DrawerTitle>
            <DrawerClose className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
              <X className="w-5 h-5 text-gray-400" />
            </DrawerClose>
          </div>

          <div className="flex flex-col gap-3 mt-1 mb-2">
            {/* 혼자 기록하기 */}
            <button
              onClick={handleIndividualRecord}
              className={cn(
                'flex items-center gap-4 p-4 rounded-2xl text-left transition-all active:scale-[0.98]',
                'bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10',
                'border border-gray-100 dark:border-white/10',
              )}
            >
              <div className="w-11 h-11 bg-itta-point/10 dark:bg-itta-point/20 rounded-xl flex items-center justify-center shrink-0">
                <User className="w-5 h-5 text-itta-point" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm dark:text-white text-[#222]">
                  혼자 기록
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  나만의 기록을 남겨요
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
            </button>

            {/* 공동 기록하기 */}
            <button
              disabled={!groupId}
              onClick={handleGroupRecord}
              className={cn(
                'flex items-center gap-4 p-4 rounded-2xl text-left transition-all active:scale-[0.98]',
                'bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10',
                'border border-gray-100 dark:border-white/10',
                !groupId && 'opacity-50 cursor-not-allowed',
              )}
            >
              <div className="w-11 h-11 bg-itta-point/10 dark:bg-itta-point/20 rounded-xl flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 text-itta-point" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm dark:text-white text-[#222]">
                  공동 기록
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  그룹원과 함께 기록해요
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
            </button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
