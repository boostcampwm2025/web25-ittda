'use client';

import { recordPreviewListOptions } from '@/lib/api/records';
import DailyDetailRecordItem from './DailyDetailRecordItem';

import { useSuspenseQuery } from '@tanstack/react-query';
import { BookOpen } from 'lucide-react';

interface DailyDetailRecordsProps {
  date: string;
  scope: 'personal' | 'groups';
  groupId?: string;
}

export default function DailyDetailRecords({
  date,
  scope,
  groupId,
}: DailyDetailRecordsProps) {
  const { data: records } = useSuspenseQuery(
    recordPreviewListOptions(date, scope, groupId),
  );

  return (
    <div className="relative border-l-[1.5px] space-y-6 transition-colors dark:border-white/10 border-gray-100">
      {records.map((record) => (
        <div key={record.postId} className="relative pl-6 group">
          <div className="absolute -left-[7.5px] top-1 w-3.5 h-3.5 rounded-full z-10 border-2 shadow-sm transition-transform group-hover:scale-125 dark:bg-white dark:border-[#121212] bg-itta-black border-white" />
          <DailyDetailRecordItem record={record} groupId={groupId} />
        </div>
      ))}
      {records.length < 1 && (
        <div className="py-16 flex flex-col items-center justify-center text-center space-y-4 rounded-2xl border border-dashed dark:bg-white/5 dark:border-white/10 bg-white border-gray-200">
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
    </div>
  );
}
