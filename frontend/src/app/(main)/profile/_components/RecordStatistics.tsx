'use client';

import { useState } from 'react';
import MonthlyUsageChart from './MonthlyUsageChart';
import WritingRecordStatistics from './WritingRecordStatistics';
import { cn } from '@/lib/utils';
import PlaceDashboard from './PlaceDashboard';
import EmotionDashboard from './EmotionDashboard';

export default function RecordStatistics() {
  const [isChartVisible, setIsChartVisible] = useState(false);

  return (
    <section className="space-y-4 sm:space-y-5 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-xs border transition-colors duration-300 dark:bg-[#1E1E1E] dark:border-white/5 bg-white border-gray-200/60">
      <WritingRecordStatistics />

      <button
        onClick={() => setIsChartVisible(!isChartVisible)}
        className="w-full text-[11px] sm:text-xs text-gray-400 font-bold dark:text-gray-400 active:scale-95 transition-all hover:text-gray-500 dark:hover:text-gray-200 flex items-center justify-center gap-1.5 sm:gap-2 py-2"
      >
        <span>{isChartVisible ? '접기' : '통계 더보기'}</span>
        <svg
          className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform duration-200 ${isChartVisible ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isChartVisible && (
        <div className="overflow-hidden transition-all duration-300 ease-in-out animate-in fade-in slide-in-from-top-2">
          <div className="pt-2 sm:pt-3">
            <MonthlyUsageChart />
          </div>

          <div className="pt-6 sm:pt-8">
            <PlaceDashboard />
          </div>

          <div className="pt-6 sm:pt-8">
            <EmotionDashboard />
          </div>
        </div>
      )}
    </section>
  );
}
