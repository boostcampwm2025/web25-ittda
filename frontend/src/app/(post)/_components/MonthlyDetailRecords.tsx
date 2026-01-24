'use client';

import { DayRecord } from '@/lib/types/record';
import { DateRecordCard } from '../../../components/ui/RecordCard';
import ViewOnMapButton from './ViewOnMapButton';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { SortOption } from './MonthlyDetailHeaderActions';
import { useMemo } from 'react';
import { myDailyRecordListOptions } from '@/lib/api/my';
import { DailyRecordList } from '@/lib/types/recordResponse';

interface MonthlyDetailRecordsProps {
  month: string;
  serverSideData: DailyRecordList[];
  routePath: string;
  viewMapRoutePath: string;
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
  serverSideData,
  month,
  routePath,
  viewMapRoutePath,
}: MonthlyDetailRecordsProps) {
  const searchParams = useSearchParams();
  const sortBy = (searchParams.get('sort') as SortOption) || 'date-desc';

  const { data: dayRecords = [] } = useQuery({
    ...myDailyRecordListOptions(month),
    initialData: serverSideData,
  });

  const sortedGroups = useMemo(() => {
    if (sortBy === 'date-desc') return dayRecords;
    return sortRecords(dayRecords, sortBy);
  }, [dayRecords, sortBy]);

  return (
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
  );
}
