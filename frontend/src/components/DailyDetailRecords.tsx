'use client';

import { recordPreviewListOptions } from '@/lib/api/records';
import DailyDetailRecordItem from './DailyDetailRecordItem';
import { RecordPreview } from '@/lib/types/recordResponse';
import { useQuery } from '@tanstack/react-query';

interface DailyDetailRecordsProps {
  memories?: RecordPreview[];
  date: string;
  scope: 'personal' | 'groups';
  groupId?: string;
}

export default function DailyDetailRecords({
  memories,
  date,
  scope,
  groupId,
}: DailyDetailRecordsProps) {
  const { data: records = [] } = useQuery({
    ...recordPreviewListOptions(date, scope, groupId),
    ...(memories && { initialData: memories }),
  });

  return (
    <div className="relative border-l-[1.5px] space-y-6 transition-colors dark:border-white/10 border-gray-100">
      {records.map((record) => (
        <div key={record.postId} className="relative pl-6 group">
          <div className="absolute -left-[7.5px] top-1 w-3.5 h-3.5 rounded-full z-10 border-2 shadow-sm transition-transform group-hover:scale-125 dark:bg-white dark:border-[#121212] bg-itta-black border-white" />
          <DailyDetailRecordItem record={record} groupId={groupId} />
        </div>
      ))}
    </div>
  );
}
