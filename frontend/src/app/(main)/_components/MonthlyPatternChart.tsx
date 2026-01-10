'use client';

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
    { subject: '행복 120', A: 120 },
    { subject: '슬픔 40', A: 40 },
    { subject: '설렘 150', A: 150 },
    { subject: '평온 90', A: 90 },
    { subject: '기대 110', A: 110 },
  ];

  return (
    <>
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-[13px] font-bold dark:text-white text-itta-black">
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
              tick={{ fontSize: 10, fill: '#64748b', fontWeight: 500 }}
            />
            <Radar
              name="Emotion"
              dataKey="A"
              stroke="#10B981"
              fill="#10B981"
              fillOpacity={0.15}
              dot={false}
              activeDot={false}
              isAnimationActive={isInitialRender}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}
