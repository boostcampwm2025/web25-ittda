'use client';

import { ChevronLeft, ChevronRight, MapIcon, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { myDailyRecordedDatesOption } from '@/lib/api/my';
import { groupDailyRecordedDatesOption } from '@/lib/api/group';

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
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 duration-500">
        <button
          onClick={() =>
            router.push(
              groupId ? `/group/${groupId}/map/${date}` : `/my/map/${date}`,
            )
          }
          className="cursor-pointer flex items-center gap-2.5 px-6 py-3.5 rounded-full shadow-2xl backdrop-blur-xl border transition-all active:scale-95 dark:bg-[#1E1E1E]/90 dark:border-white/10 dark:text-white bg-white/90 border-gray-100 text-itta-black"
        >
          <MapIcon className="w-4 h-4 text-[#10B981]" strokeWidth={2.5} />
          <span className="text-xs font-bold tracking-tight">지도로 보기</span>
        </button>
      </div>

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[80%] max-w-90 animate-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center justify-between px-6 py-1.5 rounded-full shadow-[0_20px_60px_rgba(0,0,0,0.3)] border border-white/10 transition-all bg-itta-black">
          <button
            disabled={!hasPrev}
            onClick={() => navigateDay('prev')}
            className={`cursor-pointer flex items-center gap-2 py-2 transition-all min-w-15 ${!hasPrev ? 'opacity-10' : 'active:scale-90 opacity-100'}`}
          >
            <ChevronLeft className="w-4 h-4 text-white" strokeWidth={3} />
            <span className="text-[11px] font-medium text-white tracking-tighter">
              전날
            </span>
          </button>
          <button
            // onClick={() =>
            // router.push('/add', { state: { prefilledDate: date, groupId } })
            // }
            className="cursor-pointer w-10 h-10 rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-all bg-white text-itta-black shrink-0"
          >
            <Plus className="w-5 h-5" strokeWidth={3.5} />
          </button>
          <button
            disabled={!hasNext}
            onClick={() => navigateDay('next')}
            className={`cursor-pointer flex items-center justify-center gap-2 py-2 transition-all min-w-15 text-right ${!hasNext ? 'opacity-10' : 'active:scale-90 opacity-100'}`}
          >
            <span className="text-[11px] font-medium text-white tracking-tighter">
              다음날
            </span>
            <ChevronRight className="w-4 h-4 text-white" strokeWidth={3} />
          </button>
        </div>
      </div>
    </>
  );
}
