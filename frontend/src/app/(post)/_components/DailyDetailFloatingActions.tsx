'use client';

import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { myDailyRecordedDatesOption } from '@/lib/api/my';
import {
  groupDailyRecordedDatesOption,
  groupMyRoleOptions,
} from '@/lib/api/group';
import ViewOnMapButton from './ViewOnMapButton';

interface DailyDetailFloatingActionsProps {
  groupId?: string;
  date: string;
}

export default function DailyDetailFloatingActions({
  groupId,
  date,
}: DailyDetailFloatingActionsProps) {
  const router = useRouter();

  const [year, month] = date.split('-');
  const { data: recordedDates = [] } = useQuery(
    groupId
      ? groupDailyRecordedDatesOption(groupId, year, month)
      : myDailyRecordedDatesOption(year, month),
  );

  // 그룹 게시글인 경우 권한 확인
  const { data: roleData } = useQuery({
    ...groupMyRoleOptions(groupId!),
    enabled: !!groupId,
  });

  const isViewer = roleData?.role === 'VIEWER';

  const currentIndex = recordedDates.indexOf(date || '');
  const hasPrev = currentIndex < recordedDates.length - 1;
  const hasNext = currentIndex > 0;

  const navigateDay = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && hasPrev) {
      const targetDate = recordedDates[currentIndex + 1];
      router.push(
        groupId
          ? `/group/${groupId}/detail/${targetDate}`
          : `/my/detail/${targetDate}`,
      );
    } else if (direction === 'next' && hasNext) {
      const targetDate = recordedDates[currentIndex - 1];
      router.push(
        groupId
          ? `/group/${groupId}/detail/${targetDate}`
          : `/my/detail/${targetDate}`,
      );
    }
  };

  return (
    <>
      <ViewOnMapButton
        className="bottom-24"
        routePath={
          groupId ? `/group/${groupId}/map?start=${date}` : `/map?start=${date}`
        }
      />

      <div className="fixed bottom-5 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 w-[85%] sm:w-[80%] max-w-90 animate-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center justify-between px-4 sm:px-6 py-1 sm:py-1.5 rounded-full shadow-[0_20px_60px_rgba(0,0,0,0.3)] border border-white/10 transition-all bg-itta-black">
          <button
            disabled={!hasPrev}
            onClick={() => navigateDay('prev')}
            className={`cursor-pointer flex items-center gap-1.5 sm:gap-2 py-2 transition-all min-w-12 sm:min-w-15 ${!hasPrev ? 'opacity-10' : 'active:scale-90 opacity-100'}`}
          >
            <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" strokeWidth={3} />
            <span className="text-[10px] sm:text-[11px] font-medium text-white tracking-tighter">
              전날
            </span>
          </button>
          <button
            onClick={() =>
              !isViewer &&
              router.push(groupId ? `/add?groupId=${groupId}` : '/add')
            }
            disabled={groupId ? isViewer : false}
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shadow-lg transition-all shrink-0 ${
              groupId && isViewer
                ? 'opacity-50 cursor-not-allowed bg-gray-400 text-gray-200'
                : 'cursor-pointer active:scale-90 bg-white text-itta-black'
            }`}
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={3.5} />
          </button>
          <button
            disabled={!hasNext}
            onClick={() => navigateDay('next')}
            className={`cursor-pointer flex items-center justify-end gap-1.5 sm:gap-2 py-2 transition-all min-w-12 sm:min-w-15 text-right ${!hasNext ? 'opacity-10' : 'active:scale-90 opacity-100'}`}
          >
            <span className="text-[10px] sm:text-[11px] font-medium text-white tracking-tighter">
              다음날
            </span>
            <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" strokeWidth={3} />
          </button>
        </div>
      </div>
    </>
  );
}
