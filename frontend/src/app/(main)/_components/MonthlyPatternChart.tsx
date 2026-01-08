'use client';

import { TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from 'recharts';

export default function MonthlyPatternChart() {
  const [isInitialRender, setIsInitialRender] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsInitialRender(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  const emotionData = [
    { subject: '행복', A: 120 },
    { subject: '슬픔', A: 40 },
    { subject: '설렘', A: 150 },
    { subject: '평온', A: 90 },
    { subject: '기대', A: 110 },
  ];

  return (
    <section className="rounded-2xl p-6 shadow-sm border transition-colors duration-300 dark:bg-[#1E1E1E] dark:border-white/5 bg-white border-gray-200/60">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-4 h-4 text-[#10B981]" />
        <h2 className="text-[10px] font-semibold text-gray-400 tracking-widest uppercase">
          이달의 기록 패턴
        </h2>
      </div>
      <div className="h-44 w-full mb-2">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart
            cx="50%"
            cy="50%"
            outerRadius="70%"
            responsive
            data={emotionData}
          >
            <PolarGrid stroke="var(--polar-grid-stroke)" />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 500 }}
            />
            <Radar
              name="Emotion"
              dataKey="A"
              stroke="#10B981"
              fill="#10B981"
              fillOpacity={0.15}
              isAnimationActive={isInitialRender}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
