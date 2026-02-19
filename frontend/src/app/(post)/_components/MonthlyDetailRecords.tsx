'use client';

import { DayRecord } from '@/lib/types/record';
import { DateRecordCard } from '../../../components/ui/RecordCard';
import ViewOnMapButton from './ViewOnMapButton';
import { useSuspenseQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { SortOption } from './MonthlyDetailHeaderActions';
import { useMemo } from 'react';
import { myDailyRecordListOptions } from '@/lib/api/my';

import { groupDailyRecordListOptions } from '@/lib/api/group';
import { BookOpen } from 'lucide-react';

interface MonthlyDetailRecordsProps {
  month: string;
  routePath: string;
  viewMapRoutePath: string;
  groupId?: string;
}

const sortRecords = (groups: DayRecord[], sortBy: SortOption): DayRecord[] => {
  const sorted = [...groups];
  switch (sortBy) {
    case 'count-desc':
      return sorted.sort((a, b) => b.count - a.count);
    case 'date-asc':
      return sorted.sort((a, b) => a.date.localeCompare(b.date));
    default:
      return sorted;
  }
};

export default function MonthlyDetailRecords({
  month,
  routePath,
  viewMapRoutePath,
  groupId,
}: MonthlyDetailRecordsProps) {
  const searchParams = useSearchParams();
  const sortBy = (searchParams.get('sort') as SortOption) || 'date-desc';

  const option = groupId
    ? groupDailyRecordListOptions(groupId, month)
    : myDailyRecordListOptions(month);

  const { data: dayRecords } = useSuspenseQuery(option);

  const sortedGroups = useMemo(() => {
    if (sortBy === 'date-desc') return dayRecords;
    return sortRecords(dayRecords, sortBy);
  }, [dayRecords, sortBy]);

  return (
    <>
      <div className="grid grid-cols-2 gap-4 xs:grid-cols-3 md:grid-cols-4">
        {sortedGroups.map((d) => (
          <DateRecordCard
            key={d.date}
            date={d.date}
            dayName={d.dayName}
            title={d.title}
            count={d.count}
            coverUrl={d.coverUrl}
            routePath={`${routePath}/${d.date}`}
          />
        ))}

        <ViewOnMapButton routePath={viewMapRoutePath} />
      </div>
      {sortedGroups.length < 1 && (
        <div className="w-full py-16 flex flex-col items-center justify-center text-center space-y-4 rounded-2xl border border-dashed dark:bg-white/5 dark:border-white/10 bg-white border-gray-200">
          <div className="w-14 h-14 rounded-full flex items-center justify-center dark:bg-[#10B981]/10 bg-[#10B981]/10">
            <BookOpen className="w-6 h-6 text-[#10B981]" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold dark:text-gray-200 text-gray-700">
              아직 기록이 없어요
            </p>
            <p className="text-xs text-gray-400">
              이날의 첫 번째 추억을 남겨보세요
            </p>
          </div>
        </div>
      )}
    </>
  );
}
