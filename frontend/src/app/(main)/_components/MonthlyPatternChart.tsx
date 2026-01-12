'use client';

import { useTheme } from 'next-themes';
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
  const { theme } = useTheme();

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
    <>
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
              tick={{
                fontSize: 10,
                fill: theme === 'dark' ? '#E6E7EB' : '#333333',
                fontWeight: 500,
              }}
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
