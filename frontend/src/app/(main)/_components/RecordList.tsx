'use client';

import { MemoryRecord } from '@/lib/types/record';
import { useRouter } from 'next/navigation';
import { useWeekCalendar } from '@/store/useWeekCalendar';
import { useMemo } from 'react';
import { formatDateISO } from '@/lib/date';
import { Clock } from 'lucide-react';
import CompactFieldRenderer from './CompactFieldRenderer';

interface RecordListProps {
  records: MemoryRecord[];
}

export default function RecordList({ records }: RecordListProps) {
  const router = useRouter();
  const { selectedDateStr } = useWeekCalendar();

  // 선택된 날짜에 맞는 기록 필터링
  const filteredMemories = useMemo(() => {
    const targetDate = selectedDateStr.replace(/-/g, '.');
    return records.filter((r) => r.data.date === targetDate);
  }, [selectedDateStr, records]);

  return (
    <div className="space-y-4 w-full">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-[14px] font-bold dark:text-white text-itta-black">
          {selectedDateStr === formatDateISO()
            ? '오늘의 기록'
            : `${selectedDateStr.split('-')[2]}일의 기록`}
        </h3>
        <span className="text-[11px] text-[#10B981] font-bold">
          총 {filteredMemories.length}개
        </span>
      </div>

      {filteredMemories.length > 0 ? (
        filteredMemories.map((record) => (
          <div
            key={record.id}
            onClick={() => router.push(`/record/${record.id}`)}
            className="rounded-2xl p-6 shadow-sm border active:scale-[0.98] transition-all cursor-pointer overflow-hidden dark:bg-[#1E1E1E] dark:border-white/5 bg-white border-gray-100"
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-[16px] font-bold truncate dark:text-white text-itta-black">
                {record.title}
              </h4>
              <div className="flex items-center gap-1.5 text-gray-400 font-medium text-[10px] uppercase">
                <Clock className="w-3 h-3" />
                {record.data.time}
              </div>
            </div>
            <div>
              {record.fieldOrder.map((fieldType) => (
                <CompactFieldRenderer
                  key={fieldType}
                  type={fieldType}
                  data={record.data[fieldType] as never}
                  isDetail={true}
                />
              ))}
            </div>
          </div>
        ))
      ) : (
        <div className="py-12 flex flex-col items-center justify-center text-center space-y-3 rounded-2xl border border-dashed dark:bg-white/5 dark:border-white/10 bg-white border-gray-200">
          <p className="text-xs text-gray-400 font-medium">
            이날의 기록이 없습니다.
          </p>
          <button
            onClick={() =>
              router.push(
                `/add?prefilledDate=${selectedDateStr.replace(/-/g, '.')}`,
              )
            }
            className="text-[11px] font-bold text-[#10B981] hover:underline"
          >
            기록 추가하기
          </button>
        </div>
      )}
    </div>
  );
}
