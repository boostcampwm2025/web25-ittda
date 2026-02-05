'use client';

import { useRouter } from 'next/navigation';
import { User, Users, X } from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from '@/components/ui/drawer';
import { cn } from '@/lib/utils';
import { useNewPostDraft } from '@/hooks/useGrouprRecord';
import * as Sentry from '@sentry/nextjs';
import { logger } from '@/lib/utils/logger';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/utils/errorHandler';

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
      toast.error(getErrorMessage(error));
      Sentry.captureException(error, {
        level: 'error',
        tags: { context: 'group', operation: 'create-group-record' },
        extra: { groupId },
      });
      logger.error('그룹 드래프트 생성 실패', error);
      return;
    }

    if (refetchedData?.redirectUrl) {
      router.push(refetchedData.redirectUrl);
      onOpenChange(false);
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
      console.warn('리다이렉트 URL이 없습니다.');
    }

    onOpenChange(false);
  };

  const handleIndividualRecord = () => {
    router.push(`/add?groupId=${groupId}`);
    onOpenChange(false);
  };

  return (
    <Drawer open={isOpen} onOpenChange={onOpenChange}>
      <DrawerContent className="px-6 pb-10">
        <div className="w-full ">
          <DrawerHeader className="relative pt-8 pb-6 px-0 text-left md:text-left">
            <div className="text-[10px] font-bold text-itta-point tracking-wider uppercase mb-1">
              Select Mode
            </div>
            <DrawerTitle className="text-xl font-bold dark:text-white">
              기록 방식을 선택하세요
            </DrawerTitle>
            <DrawerClose className="absolute right-0 top-8 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
              <X className="w-5 h-5 text-gray-400" />
            </DrawerClose>
          </DrawerHeader>

          <div className="grid grid-cols-2 gap-4 mt-4">
            {/* 혼자 기록하기 */}
            <button
              onClick={handleIndividualRecord}
              className={cn(
                'flex flex-col items-center justify-center gap-4 p-8 rounded-[32px] transition-all',
                'bg-gray-50 dark:bg-white/5 hover:scale-[1.02] active:scale-[0.98]',
                'border border-transparent hover:border-itta-point/30',
              )}
            >
              <div className="w-14 h-14 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-sm">
                <User className="w-7 h-7 text-itta-point" />
              </div>
              <span className="font-bold text-sm dark:text-gray-200">
                혼자 기록
              </span>
            </button>

            {/* 공동 기록하기 */}
            <button
              disabled={!groupId}
              onClick={handleGroupRecord}
              className={cn(
                'flex flex-col items-center justify-center gap-4 p-8 rounded-[32px] transition-all',
                'bg-gray-50 dark:bg-white/5 hover:scale-[1.02] active:scale-[0.98]',
                'border border-transparent hover:border-itta-point/30',
                !groupId && 'opacity-50 cursor-not-allowed grayscale',
              )}
            >
              <div className="w-14 h-14 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-sm">
                <Users className="w-7 h-7 text-itta-point" />
              </div>
              <span className="font-bold text-sm dark:text-gray-200">
                공동 기록
              </span>
            </button>
          </div>

          {/* 닫기 버튼 (참고 사진 스타일) */}
          <div className="mt-8">
            <DrawerClose asChild>
              <button className="w-full py-4 bg-[#2C2C2C] dark:bg-white text-white dark:text-black rounded-2xl font-bold text-base active:scale-[0.97] transition-all">
                닫기
              </button>
            </DrawerClose>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
