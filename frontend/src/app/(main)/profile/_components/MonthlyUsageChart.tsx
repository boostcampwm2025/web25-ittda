'use client';

import { userProfileOptions } from '@/lib/api/profile';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from 'next-themes';
import { BarChart3 } from 'lucide-react';
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

  const { data: profile, isLoading, isError } = useQuery(userProfileOptions());

  // API 응답을 차트 데이터 형식으로 변환
  const monthlyUsageData = profile?.stats.monthlyCounts
    .slice()
    .reverse()
    .slice(0, 6)
    .map((record) => {
      const [year, month] = record.month.split('-');
      return {
        name: `${year.slice(2)}.${month}`,
        value: record.count,
      };
    });

  // 모든 데이터가 0인지 확인
  const hasNoData =
    !monthlyUsageData ||
    monthlyUsageData.length === 0 ||
    monthlyUsageData.every((data) => data.value === 0);

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

  if (hasNoData) {
    return (
      <section className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-[13px] font-bold dark:text-white text-itta-black">
            월별 사용 그래프
          </h2>
        </div>
        <div className="h-44 w-full pb-3 flex flex-col items-center justify-center gap-2">
          <div className="w-12 h-12 rounded-full flex items-center justify-center dark:bg-[#10B981]/10 bg-[#10B981]/10">
            <BarChart3 className="w-5 h-5 text-[#10B981]" />
          </div>
          <div className="space-y-1 text-center">
            <p className="text-sm font-bold dark:text-gray-200 text-gray-700">
              아직 기록이 없어요
            </p>
            <p className="text-xs text-gray-400">
              첫 기록을 작성해보세요
            </p>
          </div>
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
              {profile?.stats.monthlyCounts.map((entry, index) => (
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
