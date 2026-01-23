'use client';

import { useApiQuery } from '@/hooks/useApi';
import { MyMonthlyRecordListResponse } from '@/lib/types/recordResponse';
import { useTheme } from 'next-themes';
import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ResponsiveContainer,
  XAxis,
} from 'recharts';

export default function MonthlyUsageChart() {
  const { theme } = useTheme();
  const year = new Date().getFullYear().toString();

  const {
    data: monthlyRecords,
    isLoading,
    isError,
  } = useApiQuery<MyMonthlyRecordListResponse[]>(
    ['my', 'records', 'month', year],
    `/api/user/archives/months?year=${year}`,
  );

  // API 응답을 차트 데이터 형식으로 변환
  const monthlyUsageData = (monthlyRecords ?? []).map((record) => {
    const [year, month] = record.month.split('-');
    return {
      name: `${year.slice(2)}.${month}`,
      value: record.count,
    };
  });

  if (isLoading) {
    return (
      <section className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-[13px] font-bold dark:text-white text-itta-black">
            올해 월별 사용 그래프
          </h2>
        </div>
        <div className="h-44 w-full pb-3 flex items-center justify-center">
          <div className="w-full h-32 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
        </div>
      </section>
    );
  }

  if (isError) {
    return (
      <section className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-[13px] font-bold dark:text-white text-itta-black">
            월별 사용 그래프
          </h2>
        </div>
        <div className="h-44 w-full pb-3 flex items-center justify-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            데이터를 불러올 수 없습니다.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-[13px] font-bold dark:text-white text-itta-black">
          월별 사용 그래프
        </h2>
      </div>

      <div className="h-44 w-full pb-3">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={monthlyUsageData}
            margin={{ top: 20, right: 10, left: 10, bottom: 0 }}
          >
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{
                fontSize: 11,
                fontWeight: 500,
                fill: theme === 'dark' ? '#888' : '#222',
              }}
              dy={10}
            />
            <Bar dataKey="value" radius={[2, 2, 2, 2]} barSize={40}>
              {monthlyUsageData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    index === 0
                      ? '#10B981'
                      : theme === 'dark'
                        ? '#2A2A2A'
                        : '#F1F1F1'
                  }
                />
              ))}
              <LabelList
                dataKey="value"
                position="top"
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  fill: '#10B981',
                }}
                offset={10}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
