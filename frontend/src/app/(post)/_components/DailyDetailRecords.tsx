import { MemoryRecord } from '@/lib/types/record';
import DailyDetailRecordItem from './DailyDetailRecordItem';

interface DailyDetailRecordsProps {
  memories: MemoryRecord[];
}

export default function DailyDetailRecords({
  memories,
}: DailyDetailRecordsProps) {
  return (
    <div className="relative border-l-[1.5px] space-y-12 pb-24 transition-colors dark:border-white/10 border-gray-100">
      {memories.map((record) => (
        <div key={record.id} className="relative pl-8 group">
          <div className="absolute -left-[7.5px] top-1 w-3.5 h-3.5 rounded-full z-10 border-2 shadow-sm transition-transform group-hover:scale-125 dark:bg-white dark:border-[#121212] bg-itta-black border-white" />
          <DailyDetailRecordItem record={record} />
        </div>
      ))}
    </div>
  );
}
