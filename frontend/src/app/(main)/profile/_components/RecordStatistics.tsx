// import MonthlyPatternChart from '../../_components/MonthlyPatternChart';
import MonthlyUsageChart from './MonthlyUsageChart';
import WritingRecordStatistics from './WritingRecordStatistics';

export default function RecordStatistics() {
  return (
    <section className="space-y-5 rounded-2xl p-6 shadow-xs border transition-colors duration-300 dark:bg-[#1E1E1E] dark:border-white/5 bg-white border-gray-200/60">
      <WritingRecordStatistics />

      <MonthlyUsageChart />

      {/* <MonthlyPatternChart /> */}
    </section>
  );
}
