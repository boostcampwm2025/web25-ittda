import { DayRecord } from '@/lib/types/record';
import { DateRecordCard } from './ui/RecordCard';
import ViewOnMapButton from './ViewOnMapButton';

interface MonthlyDetailRecordsProps {
  dayRecords: DayRecord[];
  routePath: string;
  viewMapRoutePath: string;
}

export default function MonthlyDetailRecords({
  dayRecords,
  routePath,
  viewMapRoutePath,
}: MonthlyDetailRecordsProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {dayRecords.map((d) => (
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
