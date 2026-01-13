'use client';

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

  const monthlyUsageData = [
    { name: '25.12', value: 86 },
    { name: '25.11', value: 48 },
    { name: '25.10', value: 22 },
    { name: '25.09', value: 34 },
    { name: '25.08', value: 6 },
  ];

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
